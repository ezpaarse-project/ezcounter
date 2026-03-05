import { resolve } from 'node:path';

import type { HarvestError, HarvestException } from '@ezcounter/models/harvest';
import type { HarvestJobData } from '@ezcounter/models/queues';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { HarvestIdleTimeout } from '~/models/timeout';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

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
 * @returns Information about harvest and future actions that need to be done. `null` if nothing to be done
 */
export function handleExceptions(
  exceptions: HarvestException[]
): HarvestResult | null {
  if (exceptions.some(({ code }) => PROCESSING_CODES.has(code))) {
    return { success: false, processing: true };
  }

  if (exceptions.some(({ code }) => UNAVAILABLE_CODES.has(code))) {
    return { success: false, unavailable: true };
  }

  const errors = exceptions.filter(({ severity }) => severity === 'error');
  if (errors.length > 0) {
    throw errors.at(-1);
  }
  return null;
}

/**
 * Get report file path based on options
 *
 * @param options - The options to harvest
 *
 * @returns The path to file
 */
function getReportPath({
  id,
  download: { cacheKey, report },
}: HarvestJobData): string {
  const release = report.release.replaceAll('.', '');
  const filename = `${report.period.start}_${report.period.end}_r${release}.json`;

  const reportPath = resolve(
    config.download.dir,
    `${cacheKey}/${report.id}/${filename}`
  );
  logger.debug({
    msg: 'Resolved report path',
    id,
    reportPath,
  });

  return reportPath;
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
 * Re-harvest if report is coming from archive, mark as error if not
 *
 * @param report - Information about report
 * @param report.path - The path to the report
 * @param report.cache - How report was sourced
 * @param options - Options to harvest
 * @param err - Error that occurred
 *
 * @returns Information about harvest and future actions that need to be done - or null if need to reharvest
 */
export function reharvestOrError(
  report: { path: string; cache: CacheResult },
  options: HarvestJobData,
  err: unknown
): HarvestResult | null {
  if (report.cache.source === 'remote') {
    logger.error({
      msg: 'Error occurred after downloading report',
      id: options.id,
      err,
    });

    return markHarvestAsError(options, asHarvestError(err));
  }

  options.download.forceDownload = true;
  logger.error({
    msg: 'Unable to use cache to harvest, re-downloading report',
    id: options.id,
    err,
  });
  return null;
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

    const harvestResult = handleExceptions(exceptions);
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

    return markHarvestAsSuccess(options);
  } catch (err) {
    const harvestResult = reharvestOrError(
      { path: reportPath, cache },
      options,
      err
    );

    return harvestResult || harvestReport(options);
  } finally {
    timeout.clear();
    await archiveReportToFile(reportPath, options, timeout);
  }
}
