import type { SUSHIReportList } from '../dist/r5';
import type { ReportInformation } from '../dist/r51';
import type { CreateDataHostFetchOptions } from './lib/fetch';
import {
  fetchR5ReportAsStream,
  fetchR5ReportList,
  type R5ReportOptions,
  type R5ReportStreamResponse,
} from './releases/r5';
import {
  fetchR51ReportAsStream,
  fetchR51ReportList,
  type R51ReportOptions,
  type R51ReportStreamResponse,
} from './releases/r51';

/**
 * Get report list from COUNTER API
 *
 * @param release - The COUNTER release to use
 * @param fetchOptions - The options of the API
 *
 * @returns The list of report
 */
export function fetchReportList(
  release: '5',
  fetchOptions: CreateDataHostFetchOptions
): Promise<SUSHIReportList[]>;
export function fetchReportList(
  release: '5.1',
  fetchOptions: CreateDataHostFetchOptions
): Promise<ReportInformation[]>;
export function fetchReportList(
  release: '5' | '5.1',
  fetchOptions: CreateDataHostFetchOptions
): Promise<SUSHIReportList[] | ReportInformation[]> {
  switch (release) {
    case '5':
      return fetchR5ReportList(fetchOptions);
    case '5.1':
      return fetchR51ReportList(fetchOptions);

    default:
      throw new Error(`COUNTER release ${release} is not supported`);
  }
}

/**
 * Get report list from COUNTER API
 *
 * @param release - The COUNTER release to use
 * @param fetchOptions - The options of the API
 *
 * @returns The list of report
 */
export function fetchReportAsStream(
  release: '5' | '5.1',
  reportOptions: R5ReportOptions | R51ReportOptions,
  fetchOptions: CreateDataHostFetchOptions
): Promise<R5ReportStreamResponse | R51ReportStreamResponse> {
  switch (release) {
    case '5':
      return fetchR5ReportAsStream(reportOptions, fetchOptions);
    case '5.1':
      return fetchR51ReportAsStream(reportOptions, fetchOptions);

    default:
      throw new Error(`COUNTER release ${release} is not supported`);
  }
}
