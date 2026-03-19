import { Readable } from 'node:stream';

import { ReportInformation } from '../../dist/r51';
import {
  createDataHostFetch,
  type CreateDataHostFetchOptions,
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
  /** Additional options to use when requesting report */
  params?: CreateDataHostFetchOptions['params'];
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
    responseType: 'stream',
    ignoreResponseError: true,
    query: {
      ...report.params,
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
