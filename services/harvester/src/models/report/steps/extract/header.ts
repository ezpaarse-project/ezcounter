import chain from 'stream-chain';

import { z } from '@ezcounter/models/lib/zod';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { createReadStream } from '~/lib/fs';
import { jsonParser, jsonPick, jsonStreamValues } from '~/lib/stream/json';
import { attachAbortSignal, waitForStreamData } from '~/lib/stream/utils';

import type { RawReportHeader } from '../../types';
import { getCounterValidation } from '../validate';

/**
 * Validation for an object that look like a Report_Header
 */
const MinimalHeader = z.looseObject({
  Release: z.string(),
  Report_ID: z.string(),
});

/**
 * Extract Report_Header from file
 *
 * @param reportPath - The path to report
 * @param options - Options to harvest
 *
 * @returns The report header
 */
export async function extractReportHeader(
  reportPath: string,
  options: HarvestDownloadOptions,
  signal?: AbortSignal
): Promise<RawReportHeader> {
  const stream = attachAbortSignal(
    chain([
      createReadStream(reportPath),
      jsonParser(),
      jsonPick({ filter: 'Report_Header', once: true }),
      jsonStreamValues(),
    ]),
    signal
  );

  // Wait for parsing
  const { value: data } =
    (await waitForStreamData<{ value: unknown }>(stream)) ?? {};
  if (!data) {
    throw new Error('Report_Header was not in downloaded report');
  }

  // Basic checks
  const min = MinimalHeader.parse(data);
  if (min.Release !== options.report.release) {
    throw new Error(
      `Expected Release ${options.report.release}, got ${min.Release}`
    );
  }
  if (min.Report_ID.toUpperCase() !== options.report.reportId.toUpperCase()) {
    throw new Error(
      `Expected Report_ID ${options.report.reportId.toUpperCase()}, got ${min.Report_ID}`
    );
  }

  // Validate header
  // If no validation exists for this Report_ID, consider it as valid
  const { header: validate } = getCounterValidation(min.Release, min.Report_ID);
  if (!validate) {
    return data as RawReportHeader;
  }

  if (validate(data)) {
    return data;
  }

  throw new Error('Report_Header is invalid', {
    cause: { validation: validate.errors },
  });
}

/**
 * Extract id of the COUNTER registry from Header
 *
 * @param header - The report header
 *
 * @returns The id or `null` if not found
 */
export function extractRegistryId(header: RawReportHeader): string | null {
  if (!header.Registry_Record) {
    return null;
  }

  const url = new URL(header.Registry_Record);
  const matches = /^\/platform\/(?<id>[a-z0-9-]+)\/?/i.exec(url.pathname);

  return matches?.groups?.id ?? null;
}
