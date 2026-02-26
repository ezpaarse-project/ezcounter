import { createGzip } from 'node:zlib';

import chain from 'stream-chain';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { appLogger } from '~/lib/logger';
import { waitForStreamEnd } from '~/lib/stream/utils';
import { createWriteStream, createReadStream, exists, unlink } from '~/lib/fs';

import type { HarvestIdleTimeout } from '~/models/timeout';

const logger = appLogger.child({ scope: 'reports' });

/**
 * Unzip an archived report
 *
 * @param report - Information about report
 * @param archivePath - The path to the archive
 * @param timeout - The timeout before an harvest job is considered as cancelled
 */
async function zipReport(
  report: { id: string; path: string },
  archivePath: string,
  timeout?: HarvestIdleTimeout
): Promise<void> {
  const stream = chain(
    [
      createReadStream(report.path),
      (chunk: unknown): unknown => {
        timeout?.tick();
        return chunk;
      },
      createGzip(),
      createWriteStream(archivePath),
    ],
    { signal: timeout?.signal }
  );

  logger.debug({
    msg: 'Zipping report...',
    id: report.id,
    reportPath: report.path,
  });

  // Wait for unzip to complete
  await waitForStreamEnd(stream);
}

/**
 * Archive report if needed
 *
 * @param report - Information about report
 * @param options - Options to download report
 * @param timeout - The timeout before an harvest job is considered as cancelled
 */
export async function archiveReport(
  report: { id: string; path: string },
  options: HarvestDownloadOptions,
  timeout?: HarvestIdleTimeout
): Promise<void> {
  if (!(await exists(report.path))) {
    throw new Error(`Report ${report.path} isn't downloaded`);
  }

  const archivePath = `${report.path}.gz`;

  const isArchived = !options.forceDownload && (await exists(archivePath));

  if (!isArchived) {
    await zipReport(report, archivePath, timeout);
  }

  await unlink(report.path);
  timeout?.tick();
}
