import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

import { addMonths, formatDate } from 'date-fns';
import { StatusCodes } from 'http-status-codes';

import type {
  DataHostAuthCheckOptions,
  DataHostAuthCheckResult,
} from '@ezcounter/dto/data-host';
import type {
  HarvestDownloadOptions,
  HarvestException,
} from '@ezcounter/dto/harvest';
import { PERIOD_FORMAT, fetchReportAsStream } from '@ezcounter/counter';

import { appConfig } from '~/lib/config';
import { createWriteStream, mkdir, unlink } from '~/lib/fs';
import { appLogger } from '~/lib/logger';
import { waitForStreamEnd } from '~/lib/stream/utils';

import type { IdleTimeoutController } from '~/models/idle-timeout';
import {
  CounterCodes,
  asHarvestError,
  asHarvestException,
} from '~/models/report/exceptions';
import { extractReportExceptions } from '~/models/report/extraction/exceptions';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json' with { type: 'json' };

const config = appConfig.temp;
const logger = appLogger.child({ scope: 'credentials' });

const AUTH_EXCEPTION_CODES = new Set([
  `http:${StatusCodes.FORBIDDEN}`,
  `http:${StatusCodes.UNAUTHORIZED}`,
  `counter:${CounterCodes.INSUFFICIENT_INFORMATION}`,
  `counter:${CounterCodes.UNAUTHORIZED_REQUESTOR}`,
  `counter:${CounterCodes.UNAUTHORIZED_REQUESTOR_INSTITUTION}`,
  `counter:${CounterCodes.INVALID_API_KEY}`,
  `counter:${CounterCodes.UNAUTHORIZED_IP_ADDRESS}`,
]);

/**
 * Download report and cache it into a file
 *
 * @param reportPath - The path to cached report
 * @param options - The options to download report
 * @param timeout - The timeout
 *
 * @returns HTTP code of the request
 */
async function cacheReport(
  reportPath: string,
  options: DataHostAuthCheckOptions,
  timeout?: IdleTimeoutController
): Promise<number> {
  const threeMonthsAgo = formatDate(addMonths(new Date(), -3), PERIOD_FORMAT);

  // Mapping options into fetch ones, leaving blank unused ones
  const response = await fetchReportAsStream(
    options.release,
    {
      id: options.report.id,
      period: options.report.period ?? {
        end: threeMonthsAgo,
        start: threeMonthsAgo,
      },
      periodFormat: options.dataHost.periodFormat,
    },
    {
      auth: options.dataHost.auth,
      baseUrl: options.dataHost.baseUrl,
      params: options.report.params,
      paramsSeparator: options.dataHost.paramsSeparator,
      signal: timeout?.signal,
      userAgent: `Mozilla/5.0 (compatible; ezCOUNTER/harvester:${appVersion})`,
    }
  );

  // Cache report
  await mkdir(dirname(reportPath), { recursive: true });
  response.data.pipe(createWriteStream(reportPath, 'utf8'));
  await waitForStreamEnd(response.data);

  return response.httpCode;
}

/**
 * Extract exceptions related to auth from report
 *
 * @param report - Report data
 * @param options - The options to extract exceptions
 * @param timeout - The timeout
 *
 * @returns The exceptions found in report
 */
async function getAuthExceptions(
  report: { path: string; httpCode: number },
  options: DataHostAuthCheckOptions,
  timeout?: IdleTimeoutController
): Promise<DataHostAuthCheckResult> {
  // Mapping options into harvest ones, leaving blank unused ones
  const harvestOptions: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    release: options.release,
    report: { id: options.report.id, period: { end: '', start: '' } },
  };

  const exceptions: HarvestException[] = [];

  const httpException = asHarvestException(report.httpCode);
  if (httpException) {
    exceptions.push(httpException);

    if (
      httpException.code.startsWith('http:') &&
      httpException.severity === 'error'
    ) {
      throw httpException;
    }
  }

  const raw = await extractReportExceptions(
    report.path,
    harvestOptions,
    timeout?.signal
  );
  exceptions.push(...raw.map((ex) => asHarvestException(ex)));

  const errors = exceptions.filter((ex) => AUTH_EXCEPTION_CODES.has(ex.code));

  return {
    errors,
    success: errors.length <= 0,
  };
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
 * Check credentials by attempting to download a report header
 *
 * @param options - The options to check credentials
 * @param timeout - The timeout
 *
 * @returns The check result
 */
export async function checkCredentials(
  options: DataHostAuthCheckOptions,
  timeout?: IdleTimeoutController
): Promise<DataHostAuthCheckResult> {
  const reportPath = join(config.dir, `${randomUUID()}.json`);

  try {
    const httpCode = await cacheReport(reportPath, options, timeout);
    timeout?.tick();

    const result = await getAuthExceptions(
      { httpCode, path: reportPath },
      options,
      timeout
    );

    return result;
  } catch (error) {
    logger.warn({
      err: error,
      msg: 'Credentials check failed',
    });

    return {
      errors: [
        {
          ...asHarvestError(error),
          severity: 'error',
        },
      ],
      success: false,
    };
  } finally {
    await uncacheReport(reportPath);
  }
}
