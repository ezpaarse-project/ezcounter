import { Readable } from 'node:stream';

import { SUSHIReportList } from '../../dist/r5';
import {
  createDataHostFetch,
  type CreateDataHostFetchOptions,
} from '../lib/fetch';
import { formatReportPeriod } from '../lib/periods';

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
  /** Additional options to use when requesting report */
  params?: CreateDataHostFetchOptions['params'];
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
