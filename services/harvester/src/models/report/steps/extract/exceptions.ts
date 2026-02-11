import chain from 'stream-chain';

import { z } from '@ezcounter/models/lib/zod';
import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { createReadStream } from '~/lib/fs';
import { jsonParser, jsonFilter, jsonStreamValues } from '~/lib/stream/json';
import { attachAbortSignal, waitForStreamData } from '~/lib/stream/utils';

import type { RawReportException } from '../../types';
import { getCounterValidation } from '../validate';

/**
 * Validation for an object that contains exceptions
 */
const MinimalExceptionParent = z.looseObject({
  Exception: z.unknown().optional(),
  Exceptions: z.array(z.unknown()).optional(),
});

/**
 * Get JSON Path to use to get exceptions based on COUNTER release
 *
 * @param release - The COUNTER release
 *
 * @returns The report header
 */
function getReportExceptionsJsonPath(release: '5' | '5.1'): RegExp {
  // Getting JSON schema of exceptions
  const { exception: validate } = getCounterValidation(release, '');
  const { properties } = validate.schema as {
    properties: Record<string, unknown>;
  };
  // List of known keys
  const keys = Object.keys(properties).join('|');
  // Supports root exception, root array of exceptions, exceptions in header
  return new RegExp(`^(Report_Header.Exceptions?.)?(\\d+.)?(${keys})$`);
}

/**
 * Resolve report exceptions
 *
 * @param data - The COUNTER report, filtered by exceptions
 *
 * @returns The found exceptions
 */
function resolveExceptions(data: unknown): unknown[] {
  if (typeof data !== 'object' || !data) {
    throw new TypeError('Report is not an object');
  }

  if (Array.isArray(data)) {
    return data;
  }

  // If it have a header
  if ('Report_Header' in data) {
    const min = MinimalExceptionParent.parse(data.Report_Header);

    return min.Exception ? [min.Exception] : (min.Exceptions ?? []);
  }

  return [data];
}

/**
 * Extract Exceptions from file
 *
 * @param reportPath - The path to report
 * @param options - Options to harvest
 *
 * @returns The exceptions
 */
export async function extractReportExceptions(
  reportPath: string,
  options: HarvestDownloadOptions,
  signal?: AbortSignal
): Promise<RawReportException[]> {
  const stream = attachAbortSignal(
    chain([
      createReadStream(reportPath),
      jsonParser(),
      jsonFilter({
        filter: getReportExceptionsJsonPath(options.report.release),
      }),
      jsonStreamValues(),
    ]),
    signal
  );

  // Wait for parsing
  const { value: data } =
    (await waitForStreamData<{ value: unknown }>(stream)) ?? {};
  if (!data) {
    return [];
  }

  const exceptions = resolveExceptions(data);

  // Getting JSON schema of exceptions
  const { exception: validate } = getCounterValidation(
    options.report.release,
    ''
  );

  return exceptions.map((ex) => {
    if (validate(ex)) {
      return ex;
    }

    throw new Error('Exception is invalid', {
      cause: { validation: validate.errors },
    });
  });
}
