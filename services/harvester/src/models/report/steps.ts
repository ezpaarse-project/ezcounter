import type { HarvestException } from '@ezcounter/dto/harvest';
import type { HarvestJobData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';

import type { HarvestIdleTimeout } from '~/models/timeout';

import { queueEnrichJob } from '~/queues/enrich';
import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import type { COUNTERReportHeader } from './dto';
import { asHarvestException } from './exceptions';
import { archiveReport } from './steps/archive';
import { cacheReport, type CacheResult } from './steps/download';
import { extractReportExceptions } from './steps/extract/exceptions';
import { extractReportHeader, extractRegistryId } from './steps/extract/header';
import { extractReportItems } from './steps/extract/items';

const logger = appLogger.child({ scope: 'reports' });

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
      msg: 'Cached report',
      id: options.id,
      source: result.source,
      httpCode: result.httpCode,
    });

    return result;
  } catch (err) {
    logger.error({
      msg: 'Unable to cache report',
      id: options.id,
      err,
    });

    throw err;
  }
}

/**
 * Shorthand to send exceptions found in report
 *
 * @param id - The job id
 * @param exceptions - The exceptions found
 */
const sendExceptionsStatus = (
  id: string,
  exceptions: HarvestException[]
): void =>
  sendHarvestJobStatusEvent({
    id,
    current: 'extract',
    status: 'processing',
    extract: {
      done: false,
      exceptions,
    },
  });

/**
 * Get report exceptions from options
 *
 * @param reportPath - The path to the report
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
      msg: 'Extracted report exceptions',
      id: options.id,
      count: raw.length,
    });

    exceptions.push(...raw.map((ex) => asHarvestException(ex)));
  } catch (err) {
    logger.warn({
      msg: 'Unable to extract exceptions',
      id: options.id,
      err,
    });

    if (err instanceof Error && err.name === 'AbortError') {
      // Throw abort error if was aborted
      throw err;
    }
  }

  sendExceptionsStatus(options.id, exceptions);
  return exceptions;
}

/**
 * Shorthand to send header found in report
 *
 * @param id - The job id
 * @param registryId - The id of the registry found in header
 */
const sendHeaderStatus = (id: string, registryId: string | null): void =>
  sendHarvestJobStatusEvent({
    id,
    current: 'extract',
    status: 'processing',
    extract: {
      done: false,
      header: true,
      registryId,
    },
  });

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
      msg: 'Extracted report header',
      id: options.id,
      registryId,
    });

    sendHeaderStatus(options.id, registryId);

    return header;
  } catch (err) {
    logger.warn({
      msg: 'Unable to extract report header',
      id: options.id,
      err,
    });

    throw err;
  }
}

/**
 * Shorthand to send items count found in report
 *
 * @param id - The job id
 * @param count - The count of items
 */
const sendItemsStatus = (id: string, count: number): void =>
  sendHarvestJobStatusEvent({
    id: id,
    current: 'extract',
    status: 'processing',
    extract: {
      done: false,
      items: count,
    },
  });

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
  try {
    const reportItems = extractReportItems(
      report.path,
      options.download,
      timeout?.signal
    );
    timeout?.tick();

    let count = 0;
    for await (const { item, parent } of reportItems) {
      count += 1;
      // Send status every 2000 items
      if (count % 2000 === 0) {
        sendItemsStatus(options.id, count);
      }

      queueEnrichJob({ item, parent, header: report.header });
      timeout?.tick();
    }

    logger.info({
      msg: 'Extracted report items',
      id: options.id,
      count,
    });

    // Send status with final count
    sendItemsStatus(options.id, count);
  } catch (err) {
    logger.warn({
      msg: 'Unable to extract report items',
      err,
    });

    throw err;
  }
}

/**
 * Archive report to a file
 *
 * @param reportPath - The path to the report
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
      { id: options.id, path: report.path, cache: report.cache },
      options.download,
      timeout
    );

    logger.info({
      msg: 'Archived report',
      id: options.id,
    });
  } catch (err) {
    logger.error({
      msg: 'Unable to archive report',
      id: options.id,
      err,
    });
  }
}
