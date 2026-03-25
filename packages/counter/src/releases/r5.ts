import { Readable } from 'node:stream';

import { SUSHIReportList } from '../../dist/r5';
import {
  createDataHostFetch,
  type CreateDataHostFetchOptions,
} from '../lib/fetch';
import { formatReportPeriod } from '../lib/periods';

/**
 * Standard reports IDs for COUNTER 5
 */
export const R5_STANDARD_REPORTS: readonly string[] = [
  'pr',
  'pr_p1',
  'dr',
  'dr_d1',
  'dr_d2',
  'tr',
  'tr_b1',
  'tr_b2',
  'tr_b3',
  'tr_j1',
  'tr_j2',
  'tr_j3',
  'tr_j4',
  'ir',
  'ir_a1',
  'ir_m1',
] as const;

/**
 * Get report list from COUNTER 5 API
 *
 * @param fetchOptions - The options of the API
 *
 * @returns The list of report
 */
export async function fetchR5ReportList(
  fetchOptions: CreateDataHostFetchOptions
): Promise<SUSHIReportList[]> {
  const $fetch = createDataHostFetch(fetchOptions);

  const data = await $fetch<unknown>('/reports');

  if (!Array.isArray(data)) {
    // oxlint-disable-next-line prefer-type-error
    throw new Error("Data Host didn't returned an array", {
      cause: typeof data,
    });
  }

  const validate = SUSHIReportList;
  return Promise.all(
    data.map(async (raw) => {
      const result = await validate(raw);
      if (typeof result === 'boolean') {
        // oxlint-disable-next-line prefer-type-error
        throw new Error("An item in report list doesn't match schema", {
          cause: validate.errors,
        });
      }
      return result;
    })
  );
}

/**
 * Type for options to use when fetching a report
 */
export type R5ReportOptions = {
  /** The report ID */
  id: string;
  /** The report period */
  period: {
    start: string;
    end: string;
  };
  periodFormat?: string;
};

/**
 * Type for the result of a streamed report
 */
export type R5ReportStreamResponse = {
  url: string;
  httpCode: number;
  expectedSize: number;
  data: Readable;
};

/**
 * Get report from COUNTER 5 API as a stream
 *
 * @param report - The options of the report
 * @param fetchOptions - The options of the API
 *
 * @returns A stream containing the report, and information about data fetched
 */
export async function fetchR5ReportAsStream(
  report: R5ReportOptions,
  fetchOptions: CreateDataHostFetchOptions
): Promise<R5ReportStreamResponse> {
  const $fetch = createDataHostFetch(fetchOptions);

  const response = await $fetch.raw(`/reports/${report.id}`, {
    responseType: 'stream',
    ignoreResponseError: true,
    query: {
      ...formatReportPeriod(report.period, report.periodFormat),
    },
  });

  if (!response._data) {
    throw new Error("Response doesn't have any data");
  }

  const size = Number.parseInt(
    response.headers.get('Content-Length') ?? '',
    10
  );

  return {
    url: response.url,
    httpCode: response.status,
    expectedSize: size,
    data: Readable.fromWeb(response._data),
  };
}
