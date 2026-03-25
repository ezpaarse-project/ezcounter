import { add, isValid, format } from 'date-fns';

import type { SUSHIReportList } from '@ezcounter/counter/schemas/r5';
import type { ReportInformation } from '@ezcounter/counter/schemas/r51';
import type { HarvestAuthOptions } from '@ezcounter/dto/harvest';
import {
  fetchReportList,
  getStandardReportIDs,
  PERIOD_FORMAT,
} from '@ezcounter/counter';

import { config } from '~/lib/config';
import { dbClient } from '~/lib/prisma';

import { version as appVersion } from '~/../package.json';

import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  DataHostWithSupportedData,
  CreateDataHostSupportedReport,
  UpdateDataHostSupportedReport,
} from '../dto';
import type { SupportedReportsRefreshOptions } from './types';

const { cacheDuration } = config.dataHost.supported;

/**
 * Type for any report list from any COUNTER release
 */
type ReportListItem = SUSHIReportList | ReportInformation;

/**
 * Type for supported data coming from remote
 *
 * Omit user provided values and common fields for 1 refresh action
 */
type RemoteSupportedReport = Omit<
  CreateDataHostSupportedReport,
  'dataHostId' | 'release' | keyof UpdateDataHostSupportedReport
>;

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
 * Shorthand to check if supported data of a release should be refreshed
 *
 * @param supportedRelease - The supported release
 *
 * @returns Should refresh or not
 */
const shouldRefresh = (supportedRelease: DataHostSupportedRelease): boolean =>
  !supportedRelease.refreshedAt ||
  add(supportedRelease.refreshedAt, cacheDuration).getTime() <= Date.now();

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
  if (typeof item.First_Month_Available === 'string') {
    const dateAvailable = new Date(item.First_Month_Available);
    if (isValid(dateAvailable)) {
      firstMonthAvailable = format(dateAvailable, PERIOD_FORMAT);
    }
  }

  let lastMonthAvailable = '';
  if (typeof item.Last_Month_Available === 'string') {
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
 * @param release - The COUNTER release used
 * @param fromHost - The list of reports (`null` if not fetched)
 * @param fromDB - The list of reports previously saved
 *
 * @returns List of supported (and unsupported) reports
 */
function mergeSupportedReports(
  release: '5' | '5.1',
  fromHost: ReportListItem[] | null,
  fromDB: DataHostSupportedReport[]
): RemoteSupportedReport[] {
  const reports = new Map<string, RemoteSupportedReport>(
    [
      // Add standard reports as unsupported
      ...getStandardReportIDs(release).map(
        (id): RemoteSupportedReport => ({
          id,
          supported: false,
          firstMonthAvailable: '',
          lastMonthAvailable: '',
        })
      ),
      // Add previous results
      ...fromDB.map((item) => ({
        ...item,
        // Reset only if we fetched data host
        supported: !fromHost,
      })),
    ].map((data) => [data.id, data])
  );

  // Apply results from data host
  for (const item of fromHost ?? []) {
    // Remove the reports not matching release
    if (item.Release !== release) {
      continue;
    }

    const id = item.Report_ID.toLowerCase();
    reports.set(id, {
      ...reports.get(id),
      id,
      supported: true,
      ...extractMonthsAvailable(item),
    });
  }

  return [...reports.values()];
}

/**
 * Applies refresh of supported data in DB using transaction
 *
 * @param release - The release
 * @param dataHost - The data host
 * @param data - The updates
 */
async function applySupportedReportsRefresh(
  release: '5' | '5.1',
  dataHost: DataHost,
  data: RemoteSupportedReport[]
): Promise<void> {
  await dbClient.$transaction([
    // Map data into queries
    ...data.map((item) =>
      dbClient.dataHostSupportedReport.upsert({
        where: {
          dataHostId_release_id: {
            dataHostId: dataHost.id,
            release,
            id: item.id,
          },
        },
        create: {
          ...item,
          dataHostId: dataHost.id,
          release,
        },
        update: item,
      })
    ),
    // Update refreshedAt
    dbClient.dataHostSupportedRelease.update({
      where: { dataHostId_release: { dataHostId: dataHost.id, release } },
      data: { refreshedAt: new Date() },
    }),
  ]);
}

/**
 * Refresh the list of supported reports for a data host
 *
 * @param dataHost - The data host to refresh, with supported data
 * @param release - The release supported by data host to refresh
 * @param auth - The auth to use to fetch remote
 *
 * @returns The list of supported reports
 */
export async function refreshSupportedReportOfDataHost(
  dataHost: DataHostWithSupportedData,
  auth: HarvestAuthOptions,
  options: SupportedReportsRefreshOptions
): Promise<DataHostSupportedReport[]> {
  const supportedRelease = getSupportedRelease(dataHost, options.release);

  const refresh = options.forceRefresh || shouldRefresh(supportedRelease);
  const reportList: ReportListItem[] | null = refresh
    ? await fetchReportList(options.release, {
        auth,
        userAgent: `Mozilla/5.0 (compatible; ezCOUNTER/api:${appVersion})`,
        baseUrl: supportedRelease.baseUrl,
        paramsSeparator: dataHost.paramsSeparator,
        params: {
          ...dataHost.params,
          ...supportedRelease.params,
        },
      })
    : null;

  const supportedReports = mergeSupportedReports(
    options.release,
    reportList,
    supportedRelease.supportedReports
  );

  if (!options.dryRun) {
    await applySupportedReportsRefresh(
      options.release,
      dataHost,
      supportedReports
    );
  }

  // oxlint-disable-next-line no-map-spread
  return supportedReports.map((report) => ({
    // Default values
    params: {},
    supportedOverride: null,
    firstMonthAvailableOverride: null,
    lastMonthAvailableOverride: null,
    createdAt: new Date(),
    // Extracted values
    ...report,
    release: options.release,
    dataHostId: dataHost.id,
    updatedAt: new Date(),
  }));
}
