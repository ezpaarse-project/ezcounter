import { createGunzip } from 'node:zlib';
import { PassThrough } from 'node:stream';

import chain from 'stream-chain';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { appLogger } from '~/lib/logger';
import { createWriteStream, createReadStream, exists, stat } from '~/lib/fs';
import { waitForStreamEnd } from '~/lib/stream/utils';

import { fetchReportAsStream } from '~/models/data-host';
import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import type { HarvestIdleTimeout } from '~/models/timeout';

const logger = appLogger.child({ scope: 'reports' });

type EventStreamData = {
  expectedSize: number;
  url: string;
  httpCode?: number;
  source: 'remote' | 'archive';
};

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
  timeout?: HarvestIdleTimeout
): PassThrough {
  let totalSize = 0;
  const stream = new PassThrough();

  // Send event on data
  stream.on('data', (chunk) => {
    totalSize += chunk.length;
    timeout?.tick();

    sendHarvestJobStatusEvent({
      id,
      current: 'download',
      status: 'processing',
      download: {
        done: false,
        source: data.source,
        url: data.url,
        httpCode: data.httpCode,
        progress:
          Number.isNaN(data.expectedSize) && data.expectedSize > 0
            ? 0
            : totalSize / data.expectedSize,
      },
    });
  });

  // Send final event
  stream.on('end', () => {
    timeout?.tick();
    sendHarvestJobStatusEvent({
      id,
      current: 'download',
      status: 'processing',
      download: {
        done: true,
        progress: 1,
      },
    });
  });

  return stream;
}

/**
 * Download a report into a file
 *
 * @param report - Information about report
 * @param options - Options to download report
 * @param timeout - The timeout before an harvest job is considered as cancelled
 */
async function downloadReport(
  report: { id: string; path: string },
  options: HarvestDownloadOptions,
  timeout?: HarvestIdleTimeout
): Promise<{ httpCode: number }> {
  const response = await fetchReportAsStream(options, timeout?.signal);

  const stream = chain([
    response.data,
    createEventStream(
      report.id,
      {
        source: 'remote',
        expectedSize: response.expectedSize,
        httpCode: response.httpCode,
        url: response.url,
      },
      timeout
    ),
    createWriteStream(report.path),
  ]);

  logger.debug({
    msg: 'Downloading report...',
    id: report.id,
    reportPath: report.path,
  });

  // Wait for download to complete
  await waitForStreamEnd(stream);

  return { httpCode: response.httpCode };
}

/**
 * Unzip an archived report
 *
 * @param report - Information about report
 * @param archivePath - The path to the archive
 * @param timeout - The timeout before an harvest job is considered as cancelled
 */
async function unzipReport(
  report: { id: string; path: string },
  archivePath: string,
  timeout?: HarvestIdleTimeout
): Promise<void> {
  const { size } = await stat(archivePath);

  const stream = chain(
    [
      createReadStream(archivePath),
      createEventStream(
        report.id,
        {
          source: 'archive',
          expectedSize: size,
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
    msg: 'Unzipping report...',
    id: report.id,
    reportPath: report.path,
  });

  // Wait for unzip to complete
  await waitForStreamEnd(stream);
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
  report: { id: string; path: string },
  options: HarvestDownloadOptions,
  timeout?: HarvestIdleTimeout
): Promise<CacheResult> {
  const archivePath = `${report.path}.gz`;

  const isFile = !options.forceDownload && (await exists(report.path));
  const isArchived = !options.forceDownload && (await exists(archivePath));

  const result: CacheResult = { source: 'file' };
  // If current version of report doesn't exists
  if (!isFile) {
    if (isArchived) {
      result.source = 'archive';
      await unzipReport(report, archivePath, timeout);
    } else {
      result.source = 'remote';
      const { httpCode } = await downloadReport(report, options, timeout);
      result.httpCode = httpCode;
    }
  }

  if (!(await exists(report.path))) {
    throw new Error(`Report ${report.path} isn't downloaded`);
  }

  return result;
}
