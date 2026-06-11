import { dirname } from 'node:path';
import { PassThrough } from 'node:stream';
import { createGunzip } from 'node:zlib';

import chain from 'stream-chain';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';
import { fetchReportAsStream } from '@ezcounter/counter';

import {
  createReadStream,
  createWriteStream,
  exists,
  mkdir,
  stat,
} from '~/lib/fs';
import { appLogger } from '~/lib/logger';
import { waitForStreamEnd } from '~/lib/stream/utils';

import type { IdleTimeoutController } from '~/models/idle-timeout';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json' with { type: 'json' };
import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

const logger = appLogger.child({ scope: 'reports' });

type EventStreamData = {
  expectedSize: number;
  url: string;
  httpCode?: number;
  source: 'remote' | 'archive' | 'file';
};

/**
 * Calculate the progress of the download
 *
 * @param total - The total size of the downloaded file
 * @param expected - The expected size of the file
 * @param count - The number of chunk processed
 *
 * @returns The progress of the download, or false if shouldn't notify
 */
function calcProgress(
  total: number,
  expected: number | null,
  count: number
): number | false {
  // oxlint-disable no-magic-numbers
  if (expected != null) {
    const progress = Math.max(0, Math.min(total / expected, 1));
    return Math.round(progress * 100) % 10 === 0 && progress;
  }
  return count % 1000 === 0 && 0;
  // oxlint-enable no-magic-numbers
}

/**
 * Create a stream that will send events about download
 *
 * @param id - The id of the job
 * @param data - The data used to setup event stream
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns A stream
 */
function createEventStream(
  id: string,
  data: EventStreamData,
  timeout?: IdleTimeoutController
): PassThrough {
  const expectedSize =
    Number.isNaN(data.expectedSize) || data.expectedSize <= 0
      ? null
      : data.expectedSize;

  let chunkCount = 0;
  let totalSize = 0;
  const stream = new PassThrough();

  // Send event on data
  stream.on('data', (chunk: Buffer) => {
    timeout?.tick();
    chunkCount += 1;
    totalSize += chunk.length;

    const progress = calcProgress(totalSize, expectedSize, chunkCount);
    if (progress !== false) {
      sendHarvestJobStatusEvent({
        download: {
          httpCode: data.httpCode,
          progress,
          source: data.source,
          status: progress === 1 ? 'done' : 'processing',
          url: data.url,
        },
        id,
        status: 'processing',
      });
    }
  });

  // Send final event
  stream.on('end', () => {
    timeout?.tick();
  });

  return stream;
}

/**
 * Download a report into a file
 *
 * @param report - Information about report
 * @param options - Options to download report
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns Information about how cache was used
 */
async function downloadReport(
  report: { jobId: string; path: string },
  options: HarvestDownloadOptions,
  timeout?: IdleTimeoutController
): Promise<CacheResult> {
  await mkdir(dirname(report.path), { recursive: true });

  const response = await fetchReportAsStream(
    options.release,
    {
      id: options.report.id,
      period: options.report.period,
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

  const stream = chain([
    response.data,
    createEventStream(
      report.jobId,
      {
        expectedSize: response.expectedSize,
        httpCode: response.httpCode,
        source: 'remote',
        url: response.url,
      },
      timeout
    ),
    createWriteStream(report.path),
  ]);

  logger.debug({
    id: report.jobId,
    msg: 'Downloading report...',
    reportPath: report.path,
  });

  // Wait for download to complete
  await waitForStreamEnd(stream);

  return { httpCode: response.httpCode, source: 'remote' };
}

/**
 * Unzip an archived report
 *
 * @param report - Information about report
 * @param archivePath - The path to the archive
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns Information about how cache was used
 */
async function unzipReport(
  report: { jobId: string; path: string },
  archivePath: string,
  timeout?: IdleTimeoutController
): Promise<CacheResult> {
  const { size } = await stat(archivePath);

  const stream = chain(
    [
      createReadStream(archivePath),
      createEventStream(
        report.jobId,
        {
          expectedSize: size,
          source: 'archive',
          url: archivePath,
        },
        timeout
      ),
      createGunzip(),
      createWriteStream(report.path),
    ],
    { signal: timeout?.signal }
  );

  logger.debug({
    id: report.jobId,
    msg: 'Unzipping report...',
    reportPath: report.path,
  });

  // Wait for unzip to complete
  await waitForStreamEnd(stream);

  return { source: 'archive' };
}

export type CacheResult = {
  source: 'remote' | 'archive' | 'file';
  httpCode?: number;
};

/**
 * Cache COUNTER report as a file
 *
 * @param report - Information about report
 * @param options - Options to download report
 * @param timeout - The timeout before an harvest job is considered as cancelled
 *
 * @returns Information about how cache was used
 */
export async function cacheReport(
  report: { jobId: string; path: string },
  options: HarvestDownloadOptions,
  timeout?: IdleTimeoutController
): Promise<CacheResult> {
  try {
    const archivePath = `${report.path}.gz`;

    const isFile = !options.forceDownload && (await exists(report.path));
    const isArchived = !options.forceDownload && (await exists(archivePath));

    let result: CacheResult = { source: 'file' };
    // If current version of report doesn't exists
    if (!isFile) {
      result = isArchived
        ? await unzipReport(report, archivePath, timeout)
        : await downloadReport(report, options, timeout);
    }
    if (!(await exists(report.path))) {
      throw new Error(`Report ${report.path} isn't downloaded`);
    }

    // Send final event
    void sendHarvestJobStatusEvent({
      download: {
        source: result.source,
        status: 'done',
      },
      id: report.jobId,
      status: 'processing',
    });

    logger.info({
      httpCode: result.httpCode,
      id: report.jobId,
      msg: 'Cached report',
      source: result.source,
    });

    return result;
  } catch (error) {
    logger.error({
      err: error,
      id: report.jobId,
      msg: 'Unable to cache report',
    });

    throw error;
  }
}
