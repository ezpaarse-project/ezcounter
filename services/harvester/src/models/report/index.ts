import { resolve } from 'node:path';

import type { HarvestError, HarvestException } from '@ezcounter/dto/harvest';
import type { HarvestJobData } from '@ezcounter/dto/queues';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { HarvestIdleTimeout } from '~/models/timeout';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import type { CacheResult } from './steps/download';
import { CounterCodes, asHarvestError } from './exceptions';
import {
  archiveReportToFile,
  cacheReportToFile,
  getReportExceptions,
  getReportHeader,
  queueReportItems,
} from './steps';

const { download: config } = appConfig;
const logger = appLogger.child({ scope: 'reports' });

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
 * Get report file path based on options
 *
 * @param options - The options to harvest
 * @param options.id - The report ID
 * @param options.download - The download options
 * @param options.download.cacheKey - The cache key
 * @param options.download.report - The report options
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
    config.dir,
    `${cacheKey}/${report.id}/${filename}`
  );
  logger.debug({
    id,
    msg: 'Resolved report path',
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
  logger.warn({
    err: error,
    id: options.id,
    msg: 'Error occurred while harvesting',
  });

  void sendHarvestJobStatusEvent({
    error,
    id: options.id,
    status: 'error',
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
    id: options.id,
    msg: 'Harvest completed',
  });

  void sendHarvestJobStatusEvent({
    current: 'extract',
    extract: {
      done: true,
    },
    id: options.id,
    status: 'processing',
  });

  return { success: true };
}

export type HarvestResult = {
  success: boolean;
  processing?: true;
  unavailable?: true;
};

/**
 * Handle various exceptions that were found in report
 *
 * @param exceptions - The exceptions that were found
 *
 * @returns Information about harvest and future actions that need to be done. `null` if nothing to be done
 */
export function handleExceptions(
  exceptions: HarvestException[]
): HarvestResult | null {
  if (exceptions.some(({ code }) => PROCESSING_CODES.has(code))) {
    return { processing: true, success: false };
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
export function reharvestOrMarkAsError(
  report: { path: string; cache: CacheResult },
  options: HarvestJobData,
  err: unknown
): HarvestResult | null {
  if (report.cache.source === 'remote') {
    logger.warn({
      err,
      id: options.id,
      msg: 'Error occurred after downloading report',
    });

    return markHarvestAsError(options, asHarvestError(err));
  }

  options.download.forceDownload = true;
  logger.warn({
    err,
    id: options.id,
    msg: 'Unable to use cache to harvest, re-downloading report',
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

  const path = getReportPath(options);
  timeout.tick();

  let cache = null;
  try {
    cache = await cacheReportToFile(path, options, timeout);
  } catch (error) {
    timeout.clear();
    return markHarvestAsError(options, asHarvestError(error));
  }

  try {
    const exceptions = await getReportExceptions(
      { httpCode: cache.httpCode, path: path },
      options,
      timeout
    );

    const result = handleExceptions(exceptions);
    if (result) {
      timeout.clear();
      return result;
    }

    const header = await getReportHeader(path, options, timeout);
    await queueReportItems(
      { date: new Date().toISOString(), header, path },
      options,
      timeout
    );

    return markHarvestAsSuccess(options);
  } catch (error) {
    const result = reharvestOrMarkAsError(
      { cache, path: path },
      options,
      error
    );

    return result ?? harvestReport(options);
  } finally {
    await archiveReportToFile({ cache, path: path }, options, timeout);
    timeout.clear();
  }
}
