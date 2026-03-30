import { Readable } from 'node:stream';

import { ReportInformation } from '../../dist/r51';
import {
  type CreateDataHostFetchOptions,
  createDataHostFetch,
} from '../lib/fetch';
import { formatReportPeriod } from '../lib/periods';

/**
 * Assert that data is an item of a report list
 *
 * @param data - The item
 */
function assertReportInformation(
  data: unknown
): asserts data is ReportInformation {
  const validate = ReportInformation;
  const isValid = validate(data);
  if (!isValid) {
    throw new Error("An item in report list doesn't match schema", {
      cause: validate.errors,
    });
  }
}

/**
 * Get report list from COUNTER 5.1 API
 *
 * @param fetchOptions - The options of the API
 *
 * @returns The list of report
 */
export async function fetchR51ReportList(
  fetchOptions: CreateDataHostFetchOptions
): Promise<ReportInformation[]> {
  const $fetch = createDataHostFetch(fetchOptions);

  const data = await $fetch<unknown>('/reports');

  if (!Array.isArray(data)) {
    // oxlint-disable-next-line prefer-type-error
    throw new Error(`Expected "array", found "${typeof data}"`);
  }

  if (data.length <= 0) {
    throw new Error(
      `Expected "length" to be at least "1", found "${data.length}"`
    );
  }

  // Validate each item
  return data.map((item) => {
    assertReportInformation(item);
    return item;
  });
}

/**
 * Type for options to use when fetching a report
 */
export type R51ReportOptions = {
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
export type R51ReportStreamResponse = {
  url: string;
  httpCode: number;
  expectedSize: number;
  data: Readable;
};

/**
 * Get report from COUNTER 5.1 API as a stream
 *
 * @param report - The options of the report
 * @param fetchOptions - The options of the API
 *
 * @returns A stream containing the report, and information about data fetched
 */
export async function fetchR51ReportAsStream(
  report: R51ReportOptions,
  fetchOptions: CreateDataHostFetchOptions
): Promise<R51ReportStreamResponse> {
  const $fetch = createDataHostFetch(fetchOptions);

  const response = await $fetch.raw(`/reports/${report.id}`, {
    ignoreResponseError: true,
    query: {
      ...formatReportPeriod(report.period, report.periodFormat),
    },
    responseType: 'stream',
  });

  if (!response._data) {
    throw new Error("Response doesn't have any data");
  }

  const size = Number.parseInt(
    response.headers.get('Content-Length') ?? '',
    10
  );

  return {
    data: Readable.fromWeb(response._data),
    expectedSize: size,
    httpCode: response.status,
    url: response.url,
  };
}

/**
 * Standard reports IDs for COUNTER 5.1
 */
export const R51_STANDARD_REPORTS: readonly string[] = [
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
