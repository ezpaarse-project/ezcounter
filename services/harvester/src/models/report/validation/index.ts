import type { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';
import { z } from '@ezcounter/dto';
import {
  type ReportValidationOptions,
  type ReportValidationResult,
  ReportValidationResultError,
  type ReportValidationResultPart,
} from '@ezcounter/dto/report';
import { waitForGenerator } from '@ezcounter/toolbox/utils';

import { appConfig } from '~/lib/config';
import { createWriteStream, mkdir, unlink } from '~/lib/fs';
import { appLogger } from '~/lib/logger';
import { waitForStreamEnd } from '~/lib/stream/utils';

import { extractReportHeader } from '~/models/report/extraction/header';
import { extractReportItems } from '~/models/report/extraction/items';

const config = appConfig.temp;
const logger = appLogger.child({ scope: 'validate' });

const ErrorCause = z.object({
  cause: z.object({ validation: z.array(ReportValidationResultError) }),
});

/**
 * Cache report data into a file
 *
 * @param stream - The report data
 * @param reportPath - The path to cached report
 */
async function cacheReport(
  stream: Readable,
  reportPath: string
): Promise<void> {
  await mkdir(dirname(reportPath), { recursive: true });
  stream.pipe(createWriteStream(reportPath, 'utf8'));

  await waitForStreamEnd(stream);
}

/**
 * Transform errors from extraction into validation errors
 *
 * @param error - The error thrown
 *
 * @returns Error as validation error
 */
function asValidationResultError(
  error: unknown
): ReportValidationResultError[] {
  const { data: validationError } = ErrorCause.safeParse(error);
  if (validationError) {
    return validationError.cause.validation;
  }

  if (error instanceof Error) {
    return [{ message: error.message }];
  }

  return [{ message: `${error}` }];
}

/**
 * Check if Report_Header of report is valid
 *
 * @param reportPath - The path to the report
 * @param options - The options for validating report
 *
 * @returns Validation result
 */
async function validateHeader(
  reportPath: string,
  options: ReportValidationOptions
): Promise<ReportValidationResultPart> {
  // Mapping options into harvest ones, leaving blank unused ones
  const harvestOptions: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    release: options.release,
    report: { id: options.reportId, period: { end: '', start: '' } },
  };

  try {
    await extractReportHeader(reportPath, harvestOptions);
  } catch (error) {
    return { errors: asValidationResultError(error), valid: false };
  }

  return { errors: [], valid: true };
}

/**
 * Check if Report_Items of report are valid
 *
 * @param reportPath - The path to the report
 * @param options - The options for validating report
 *
 * @returns Validation result
 */
async function validateItems(
  reportPath: string,
  options: ReportValidationOptions
): Promise<ReportValidationResultPart> {
  // Mapping options into harvest ones, leaving blank unused ones
  const harvestOptions: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    release: options.release,
    report: { id: options.reportId, period: { end: '', start: '' } },
  };

  try {
    await waitForGenerator(
      // Mapping options into harvest ones, leaving blank unused ones
      extractReportItems(reportPath, harvestOptions)
    );
  } catch (error) {
    return { errors: asValidationResultError(error), valid: false };
  }

  return { errors: [], valid: true };
}

/**
 * Delete report from cache
 *
 * @param reportPath - The path to cached report
 */
async function uncacheReport(reportPath: string): Promise<void> {
  try {
    await unlink(reportPath);
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to delete file',
    });
  }
}

/**
 * Check if report is valid
 *
 * @param stream - The stream containing report data
 * @param options - The options for validating report
 *
 * @returns Validation result
 */
export async function validateReport(
  stream: Readable,
  options: ReportValidationOptions
): Promise<ReportValidationResult> {
  const reportPath = join(config.dir, `${randomUUID()}.json`);

  try {
    // Cache report
    await cacheReport(stream, reportPath);

    const result = {
      header: await validateHeader(reportPath, options),
      items: await validateItems(reportPath, options),
    };

    return result;
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to validate report',
    });

    throw error;
  } finally {
    await uncacheReport(reportPath);
  }
}
