import { format, isValid } from 'date-fns';

import type { SUSHIReportList } from '@ezcounter/counter/schemas/r5';
import type { ReportInformation } from '@ezcounter/counter/schemas/r51';
import type { HarvestAuthOptions } from '@ezcounter/dto/harvest';
import {
  PERIOD_FORMAT,
  fetchReportList,
  getStandardReportIDs,
} from '@ezcounter/counter';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json';

import type {
  DataHostSupportedRelease,
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from './dto';

/**
 * Type for any report list from any COUNTER release
 */
type ReportListItem = SUSHIReportList | ReportInformation;

/**
 * Type for supported data coming from remote
 */
type RemoteSupportedReport = {
  id: string;
  firstMonthAvailable: string;
  lastMonthAvailable: string;
  supported: boolean;
};

/**
 * Shorthand to get supported data about a release of a data host
 *
 * @param dataHost - The data host
 * @param release - The release
 *
 * @returns The supported data
 */
function getSupportedRelease(
  dataHost: DataHostWithSupportedData,
  release: '5' | '5.1'
): DataHostSupportedRelease & { supportedReports: DataHostSupportedReport[] } {
  const supportedRelease = dataHost.supportedReleases.find(
    (item) => item.release === release
  );
  if (!supportedRelease) {
    throw new Error(`Release ${release} is not supported by data host`);
  }
  return supportedRelease;
}

/**
 * Shorthand to extract months available from data host's reports
 *
 * @param item - The report
 *
 * @returns The months available
 */
function extractMonthsAvailable(item: ReportListItem): {
  firstMonthAvailable: string;
  lastMonthAvailable: string;
} {
  let firstMonthAvailable = '';
  if (
    'First_Month_Available' in item &&
    typeof item.First_Month_Available === 'string'
  ) {
    const dateAvailable = new Date(item.First_Month_Available);
    if (isValid(dateAvailable)) {
      firstMonthAvailable = format(dateAvailable, PERIOD_FORMAT);
    }
  }

  let lastMonthAvailable = '';
  if (
    'Last_Month_Available' in item &&
    typeof item.Last_Month_Available === 'string'
  ) {
    const dateAvailable = new Date(item.Last_Month_Available);
    if (isValid(dateAvailable)) {
      lastMonthAvailable = format(dateAvailable, PERIOD_FORMAT);
    }
  }

  return {
    firstMonthAvailable,
    lastMonthAvailable,
  };
}

/**
 * Merge report list from data host with old values and standard reports
 *
 * @param reportList - The list of reports
 * @param overrides - The overrides saved
 * @param release - The COUNTER release used
 *
 * @returns List of supported (and unsupported) reports
 */
function mergeSupportedReports(
  reportList: ReportListItem[],
  overrides: DataHostSupportedReport[],
  release: '5' | '5.1'
): (DataHostSupportedReport | RemoteSupportedReport)[] {
  // Using a map to deduplicate items
  const reports = new Map<string, RemoteSupportedReport>([
    // Mark standard reports as unsupported
    ...getStandardReportIDs(release).map(
      (id): [string, RemoteSupportedReport] => [
        id,
        {
          firstMonthAvailable: '',
          id,
          lastMonthAvailable: '',
          supported: false,
        },
      ]
    ),
    // Apply results from data host
    ...reportList
      .filter(({ Release }) => Release === release)
      .map((report): [string, RemoteSupportedReport] => {
        const id = report.Report_ID.toLowerCase();

        return [
          id,
          {
            id,
            supported: true,
            ...extractMonthsAvailable(report),
          },
        ];
      }),
  ]);
  // Apply overrides
  for (const report of overrides) {
    const previous = reports.get(report.id);
    reports.set(report.id, {
      ...report,
      firstMonthAvailable:
        report.firstMonthAvailable ?? previous?.firstMonthAvailable ?? '',
      lastMonthAvailable:
        report.lastMonthAvailable ?? previous?.lastMonthAvailable ?? '',
      supported: report.supported ?? previous?.supported ?? false,
    });
  }
  return [...reports.values()];
}

/**
 * Refresh the list of supported reports for a data host
 *
 * @param dataHost - The data host to refresh, with supported data
 * @param auth - The auth to use to fetch remote
 * @param release - The COUNTER release to use
 *
 * @returns The list of supported reports
 */
export async function fetchSupportedReportsOfDataHost(
  dataHost: DataHostWithSupportedData,
  auth: HarvestAuthOptions,
  release: '5' | '5.1'
): Promise<DataHostSupportedReport[]> {
  const supportedRelease = getSupportedRelease(dataHost, release);

  const createdAt = new Date();
  const reportList = await fetchReportList(release, {
    auth,
    baseUrl: supportedRelease.baseUrl,
    params: {
      ...dataHost.params,
      ...supportedRelease.params,
    },
    paramsSeparator: dataHost.paramsSeparator,
    userAgent: `Mozilla/5.0 (compatible; ezCOUNTER/api:${appVersion})`,
  });

  const supportedReports = mergeSupportedReports(
    reportList,
    supportedRelease.supportedReports,
    release
  );

  // oxlint-disable-next-line no-map-spread
  return supportedReports.map((report) => ({
    // Default values
    createdAt,
    params: {},
    updatedAt: new Date(),
    // Extracted values
    ...report,
    dataHostId: dataHost.id,
    release,
  }));
}
