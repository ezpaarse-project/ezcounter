import { ofetch, type $Fetch } from 'ofetch';
import { format as formatDate, parse as parseDate } from 'date-fns';

import { Readable } from 'node:stream';

import type {
  HarvestDataHostOptions,
  HarvestDownloadOptions,
} from '@ezcounter/models/harvest';

import { RawReportList } from '~/models/report/types';

import { version as appVersion } from '~/../package.json' with { type: 'json' };

/**
 * Transform query params into params supported by COUNTER API
 *
 * @param value - The value of the param
 * @param paramsSeparator - How to separate params
 *
 * @returns The value
 */
function transformCOUNTERQuery(
  value: unknown,
  paramsSeparator = '|'
): string | undefined {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`).join(paramsSeparator);
  }

  switch (typeof value) {
    case 'boolean':
      return value ? 'True' : 'False';

    case 'function':
    case 'object':
    case 'symbol':
    case 'undefined':
      return undefined;

    default:
      return `${value}`;
  }
}

/**
 * Create ofetch instance to make request to COUNTER API
 *
 * @param dataHost - The options of the API
 *
 * @returns Instance used to make request
 */
const createDataHostFetch = (dataHost: HarvestDataHostOptions): $Fetch =>
  ofetch.create({
    baseURL: dataHost.baseUrl,
    headers: {
      'User-Agent': `Mozilla/5.0 (compatible; app/${appVersion})`,
      Accept: 'application/json',
    },
    query: {
      ...dataHost.additionalParams,
      customer_id: dataHost.auth.customer_id,
      requestor_id: dataHost.auth.requestor_id,
      api_key: dataHost.auth.api_key,
    },
    onRequest: [
      // Parse query parameters
      ({ options }): void => {
        options.query = Object.fromEntries(
          Object.entries(options.query ?? {}).map(([key, value]) => [
            key,
            transformCOUNTERQuery(value, dataHost.paramsSeparator),
          ])
        );
      },
    ],
  });

/**
 * Get report list from COUNTER API
 *
 * @param endpoint - The options of the API
 *
 * @returns The list of report (unaware of COUNTER version used)
 */
export async function fetchReportList(
  endpoint: HarvestDataHostOptions
): Promise<RawReportList> {
  const $fetch = createDataHostFetch(endpoint);

  const response = await $fetch<unknown>('/reports');

  return RawReportList.parse(response);
}

/**
 * Format date to request report
 *
 * @param dateMonth - The month from DownloadOptions
 * @param [format] - The format, default to `yyyy-MM-dd`
 */
function formatReportDate(dateMonth: string, format = 'yyyy-MM-dd'): string {
  const date = parseDate(dateMonth, 'yyyy-MM', new Date());
  return formatDate(date, format);
}

type ReportStreamResponse = {
  url: string;
  httpCode: number;
  expectedSize: number;
  data: Readable;
};

/**
 * Get report from COUNTER API as a stream
 *
 * @param downloadOptions - The options needed to get report
 * @param signal - The abort signal
 *
 * @returns A stream containing the report, and information about data fetched
 */
export async function fetchReportAsStream(
  { dataHost, report }: HarvestDownloadOptions,
  signal?: AbortSignal
): Promise<ReportStreamResponse> {
  const $fetch = createDataHostFetch(dataHost);

  const response = await $fetch.raw(`/reports/${report.reportId}`, {
    responseType: 'stream',
    ignoreResponseError: true,
    query: {
      ...report.params,
      begin_date: formatReportDate(report.period.start, dataHost.periodFormat),
      end_date: formatReportDate(report.period.end, dataHost.periodFormat),
    },
    signal,
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
