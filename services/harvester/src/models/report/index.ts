import { resolve } from 'node:path';

import type { HarvestError, HarvestException } from '@ezcounter/models/harvest';
import type { HarvestJobData } from '@ezcounter/models/queues';

import { appLogger } from '~/lib/logger';
import { config } from '~/lib/config';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import { HarvestIdleTimeout } from '~/models/timeout';

import type { CacheResult } from './steps/download';
import { asHarvestError, CounterCodes } from './exceptions';
import {
  cacheReportToFile,
  getReportExceptions,
  getReportHeader,
  queueReportItems,
  archiveReportToFile,
} from './steps';

const logger = appLogger.child({ scope: 'reports' });

type HarvestResult = {
  success: boolean;
  processing?: true;
  unavailable?: true;
};

// COUNTER Codes that will indicate that data host is processing request
const PROCESSING_CODES = new Set(
  [CounterCodes.QUEUED_FOR_PROCESSING].map((code) => `counter:${code}`)
);

// COUNTER Codes that will indicate that data host is unavailable
const UNAVAILABLE_CODES = new Set(
  [
    CounterCodes.SERVICE_BUSY,
    CounterCodes.TOO_MANY_REQUESTS,
    CounterCodes.SERVICE_UNAVAILABLE,
  ].map((code) => `counter:${code}`)
);

/**
 * Handle various exceptions that were found in report
 *
 * @param options - The options to harvest
 *
 * @returns Information about harvest and future actions that need to be done. `null` if nothing to be done
 */
function handleExceptions(
  options: HarvestJobData,
  exceptions: HarvestException[]
): HarvestResult | null {
  if (exceptions.some(({ code }) => PROCESSING_CODES.has(code))) {
    // Force download of a new report
    options.download.report.forceDownload = true;
    return { success: false, processing: true };
  }

  if (exceptions.some(({ code }) => UNAVAILABLE_CODES.has(code))) {
    // Force download of a new report
    options.download.report.forceDownload = true;
    return { success: false, unavailable: true };
  }

  const errors = exceptions.filter(({ severity }) => severity === 'error');
  if (errors.length <= 0) {
    return null;
  }

  throw new Error('Error exception found in report', {
    cause: {
      exceptions: errors,
    },
  });
}

/**
 * Get report file path based on options
 *
 * @param options - The options to harvest
 *
 * @returns The path to file
 */
function getReportPath({
  download: { cacheKey, report },
}: HarvestJobData): string {
  const release = report.release.replaceAll('.', '');
  const filename = `${report.period.start}_${report.period.end}_r${release}.json`;

  return resolve(
    config.download.dir,
    `${cacheKey}/${report.reportId}/${filename}`
  );
}

/**
 * Send error event
 *
 * @param options - The options to harvest
 * @param error - The error that occurred
 *
 * @returns Information about harvest and future actions that need to be done
 */
function markHarvestAsError(
  options: HarvestJobData,
  error: HarvestError
): HarvestResult {
  logger.error({
    msg: 'Error occurred while harvesting',
    id: options.id,
    err: error,
  });

  sendHarvestJobStatusEvent({
    id: options.id,
    status: 'error',
    error,
  });

  return { success: false };
}

/**
 * Send success event
 *
 * @param options - The options to harvest
 * @param error - The error that occurred
 *
 * @returns Information about harvest and future actions that need to be done
 */
function markHarvestAsSuccess(options: HarvestJobData): HarvestResult {
  logger.info({
    msg: 'Harvest completed',
    id: options.id,
  });

  sendHarvestJobStatusEvent({
    id: options.id,
    status: 'processing',
    current: 'extract',
    extract: {
      done: true,
    },
  });

  return { success: true };
}

/**
 * Reharvest if report is coming from archive, mark as error if not
 *
 * @param report - Information about report
 * @param report.path - The path to the report
 * @param report.cache - How report was sourced
 * @param options - Options to harvest
 * @param err - Error that occured
 *
 * @returns Information about harvest and future actions that need to be done
 */
async function reharvestOrError(
  report: { path: string; cache: CacheResult },
  options: HarvestJobData,
  err: unknown
): Promise<HarvestResult> {
  if (report.cache.source === 'remote') {
    logger.error({
      msg: 'Error occurred after downloading report',
      id: options.id,
      err,
    });

    await archiveReportToFile(report.path, options);

    return markHarvestAsError(options, asHarvestError(err));
  }

  logger.error({
    msg: 'Unable to use cache to harvest, re-downloading report',
    id: options.id,
    err,
  });

  options.download.report.forceDownload = true;
  return harvestReport(options);
}

/**
 * Harvest a COUNTER report, extract useful data and pass it to next service
 *
 * @param options - The options to harvest
 *
 * @returns Information about harvest and future actions that need to be done
 */
export async function harvestReport(
  options: HarvestJobData
): Promise<HarvestResult> {
  const timeout = new HarvestIdleTimeout(options.download.timeout);

  const reportPath = getReportPath(options);
  logger.debug({
    msg: 'Resolved report path',
    id: options.id,
    reportPath,
  });
  timeout.tick();

  let cache;
  try {
    cache = await cacheReportToFile(reportPath, options, timeout);
  } catch (err) {
    timeout.clear();
    return markHarvestAsError(options, asHarvestError(err));
  }

  try {
    const exceptions = await getReportExceptions(
      { path: reportPath, httpCode: cache.httpCode },
      options,
      timeout
    );

    const harvestResult = handleExceptions(options, exceptions);
    if (harvestResult) {
      timeout.clear();
      return harvestResult;
    }

    const reportHeader = await getReportHeader(reportPath, options, timeout);

    await queueReportItems(
      { path: reportPath, header: reportHeader },
      options,
      timeout
    );
  } catch (err) {
    timeout.clear();
    return reharvestOrError({ path: reportPath, cache }, options, err);
  }

  await archiveReportToFile(reportPath, options, timeout);
  timeout.clear();
  return markHarvestAsSuccess(options);
}
