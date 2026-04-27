import type { SUSHIReportList as R5ReportListItem } from '../dist/r5';
import type { ReportInformation as R51ReportListItem } from '../dist/r51';
import type { CreateDataHostFetchOptions } from './lib/fetch';
import {
  type R5ReportOptions,
  type R5ReportStreamResponse,
  R5_STANDARD_REPORTS,
  fetchR5ReportAsStream,
  fetchR5ReportList,
} from './releases/r5';
import {
  type R51ReportOptions,
  type R51ReportStreamResponse,
  R51_STANDARD_REPORTS,
  fetchR51ReportAsStream,
  fetchR51ReportList,
} from './releases/r51';

type COUNTERReportList = R5ReportListItem[] | R51ReportListItem[];

type COUNTERReportOptions = R5ReportOptions | R51ReportOptions;

type COUNTERReportStreamResponse =
  | R5ReportStreamResponse
  | R51ReportStreamResponse;

/**
 * Format used within app to store periods
 */
export const PERIOD_FORMAT = 'yyyy-MM';

/**
 * Get report list from COUNTER API
 *
 * @param release - The COUNTER release to use
 * @param fetchOptions - The options of the API
 *
 * @returns The list of report
 */
export function fetchReportList(
  release: '5' | '5.1',
  fetchOptions: CreateDataHostFetchOptions
): Promise<COUNTERReportList> {
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
 * @param reportOptions - The options of the report
 * @param fetchOptions - The options of the API
 *
 * @returns The list of report
 */
export function fetchReportAsStream(
  release: '5' | '5.1',
  reportOptions: COUNTERReportOptions,
  fetchOptions: CreateDataHostFetchOptions
): Promise<COUNTERReportStreamResponse> {
  switch (release) {
    case '5':
      return fetchR5ReportAsStream(reportOptions, fetchOptions);

    case '5.1':
      return fetchR51ReportAsStream(reportOptions, fetchOptions);

    default:
      throw new Error(`COUNTER release ${release} is not supported`);
  }
}

/**
 * Get standard reports IDs for a COUNTER release
 *
 * @param release - The COUNTER release to use
 *
 * @returns The list of standard reports IDs
 */
export function getStandardReportIDs(release: '5' | '5.1'): readonly string[] {
  switch (release) {
    case '5':
      return R5_STANDARD_REPORTS;

    case '5.1':
      return R51_STANDARD_REPORTS;

    default:
      throw new Error(`COUNTER release ${release} is not supported`);
  }
}
