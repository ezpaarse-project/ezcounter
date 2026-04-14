import type { HarvestException } from '@ezcounter/dto/harvest';
import type { HarvestJobData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';

import type { HarvestIdleTimeout } from '~/models/timeout';

import { queueEnrichJob } from '~/queues/enrich';
import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import type { COUNTERReportHeader } from './dto';
import { asHarvestException } from './exceptions';
import { archiveReport } from './steps/archive';
import { type CacheResult, cacheReport } from './steps/download';
import { extractReportExceptions } from './steps/extract/exceptions';
import { extractRegistryId, extractReportHeader } from './steps/extract/header';
import { extractReportItems } from './steps/extract/items';

const ITEMS_NOTIFY_INTERVAL = 250;

const logger = appLogger.child({ scope: 'reports' });

/**
 * Shorthand to send exceptions found in report
 *
 * @param id - The job id
 * @param exceptions - The exceptions found
 */
const sendExceptionsStatus = (
  id: string,
  exceptions: HarvestException[]
): void => {
  void sendHarvestJobStatusEvent({
    current: 'extract',
    extract: {
      done: false,
      exceptions,
    },
    id,
    status: 'processing',
  });
};

/**
 * Shorthand to send header found in report
 *
 * @param id - The job id
 * @param registryId - The id of the registry found in header
 */
const sendHeaderStatus = (id: string, registryId: string | null): void => {
  void sendHarvestJobStatusEvent({
    current: 'extract',
    extract: {
      done: false,
      header: true,
      registryId,
    },
    id,
    status: 'processing',
  });
};

/**
 * Shorthand to send items count found in report
 *
 * @param id - The job id
 * @param count - The count of items
 */
const sendItemsStatus = (id: string, count: number): void => {
  void sendHarvestJobStatusEvent({
    current: 'extract',
    extract: {
      done: false,
      items: count,
    },
    id: id,
    status: 'processing',
  });
};

/**
 * Cache report to a file
 *
 * @param reportPath - The path to the report
 * @param options - The options to harvest
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns Information about how cache was used
 */
export async function cacheReportToFile(
  reportPath: string,
  options: HarvestJobData,
  timeout?: HarvestIdleTimeout
): Promise<CacheResult> {
  try {
    const result = await cacheReport(
      { jobId: options.id, path: reportPath },
      options.download,
      timeout
    );

    // No need to tick timeout as cache already does it
    logger.info({
      httpCode: result.httpCode,
      id: options.id,
      msg: 'Cached report',
      source: result.source,
    });

    return result;
  } catch (error) {
    logger.error({
      err: error,
      id: options.id,
      msg: 'Unable to cache report',
    });

    throw error;
  }
}

/**
 * Get report exceptions from options
 *
 * @param report - Information about report
 * @param options - The options to harvest
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns The exceptions found, `null` otherwise
 */
export async function getReportExceptions(
  report: { path: string; httpCode?: number },
  options: HarvestJobData,
  timeout?: HarvestIdleTimeout
): Promise<HarvestException[]> {
  const exceptions: HarvestException[] = [];
  if (report.httpCode) {
    const httpException = asHarvestException(report.httpCode);
    if (httpException) {
      exceptions.push(httpException);
    }
  }

  try {
    const raw = await extractReportExceptions(
      report.path,
      options.download,
      timeout?.signal
    );

    timeout?.tick();
    logger.info({
      count: raw.length,
      id: options.id,
      msg: 'Extracted report exceptions',
    });

    exceptions.push(...raw.map((ex) => asHarvestException(ex)));
  } catch (error) {
    logger.warn({
      err: error,
      id: options.id,
      msg: 'Unable to extract exceptions',
    });

    if (error instanceof Error && error.name === 'AbortError') {
      // Throw abort error if was aborted
      throw error;
    }
  }

  sendExceptionsStatus(options.id, exceptions);
  return exceptions;
}

/**
 * Get report header from options
 *
 * @param reportPath - The path to the report
 * @param options - The options to harvest
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns The header if found, `null` otherwise
 */
export async function getReportHeader(
  reportPath: string,
  options: HarvestJobData,
  timeout?: HarvestIdleTimeout
): Promise<COUNTERReportHeader> {
  try {
    const header = await extractReportHeader(
      reportPath,
      options.download,
      timeout?.signal
    );

    const registryId = extractRegistryId(header);

    timeout?.tick();
    logger.info({
      id: options.id,
      msg: 'Extracted report header',
      registryId,
    });

    sendHeaderStatus(options.id, registryId);

    return header;
  } catch (error) {
    logger.warn({
      err: error,
      id: options.id,
      msg: 'Unable to extract report header',
    });

    throw error;
  }
}

/**
 * Queue report items to other services
 *
 * @param report - Information about report
 * @param options - The options to harvest
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns `true` if no error occurred
 */
export async function queueReportItems(
  report: { path: string; header: COUNTERReportHeader },
  options: HarvestJobData,
  timeout?: HarvestIdleTimeout
): Promise<void> {
  let notifier: NodeJS.Timeout | null = null;

  try {
    const reportItems = extractReportItems(
      report.path,
      options.download,
      timeout?.signal
    );
    timeout?.tick();

    let count = 0;
    // Setup notifier
    notifier = setInterval(() => {
      sendItemsStatus(options.id, count);
    }, ITEMS_NOTIFY_INTERVAL);

    for await (const { item, parent } of reportItems) {
      count += 1;
      queueEnrichJob({ header: report.header, item, parent });
      timeout?.tick();
    }

    clearInterval(notifier);

    logger.info({
      count,
      id: options.id,
      msg: 'Extracted report items',
    });

    // Send status with final count
    sendItemsStatus(options.id, count);
  } catch (error) {
    if (notifier) {
      clearInterval(notifier);
    }

    logger.warn({
      err: error,
      msg: 'Unable to extract report items',
    });

    throw error;
  }
}

/**
 * Archive report to a file
 *
 * @param report - Information about report
 * @param options - The options to harvest
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns `true` if no error occurred
 */
export async function archiveReportToFile(
  report: { path: string; cache: CacheResult },
  options: HarvestJobData,
  timeout?: HarvestIdleTimeout
): Promise<void> {
  try {
    await archiveReport(
      { cache: report.cache, id: options.id, path: report.path },
      options.download,
      timeout
    );

    logger.info({
      id: options.id,
      msg: 'Archived report',
    });
  } catch (error) {
    logger.error({
      err: error,
      id: options.id,
      msg: 'Unable to archive report',
    });
  }
}
