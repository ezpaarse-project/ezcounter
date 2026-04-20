import { add, format, isValid } from 'date-fns';

import type { SUSHIReportList } from '@ezcounter/counter/schemas/r5';
import type { ReportInformation } from '@ezcounter/counter/schemas/r51';
import type { HarvestAuthOptions } from '@ezcounter/dto/harvest';
import {
  PERIOD_FORMAT,
  fetchReportList,
  getStandardReportIDs,
} from '@ezcounter/counter';

import { appConfig } from '~/lib/config';
import { dbClient } from '~/lib/prisma';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json';

import type {
  CreateDataHostSupportedReport,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  DataHostWithSupportedData,
  UpdateDataHostSupportedReport,
} from './dto';

const { supported: config } = appConfig.dataHost;

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
 * Type for options to provide when refreshing supported data
 */
type SupportedReportsRefreshOptions = {
  release: '5' | '5.1';
  dryRun?: boolean;
  forceRefresh?: boolean;
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
 * Shorthand to check if supported data of a release should be refreshed
 *
 * @param supportedRelease - The supported release
 *
 * @returns Should refresh or not
 */
const shouldRefresh = (supportedRelease: DataHostSupportedRelease): boolean =>
  !supportedRelease.refreshedAt ||
  add(supportedRelease.refreshedAt, config.cacheDuration).getTime() <=
    Date.now();

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
          firstMonthAvailable: '',
          id,
          lastMonthAvailable: '',
          supported: false,
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
    // Keep reports matching release
    if (item.Release === release) {
      const id = item.Report_ID.toLowerCase();
      reports.set(id, {
        ...reports.get(id),
        id,
        supported: true,
        ...extractMonthsAvailable(item),
      });
    }
  }

  return [...reports.values()];
}

/**
 * Applies refresh of supported data in DB using transaction
 *
 * @param release - The release
 * @param dataHostId - The id of data host
 * @param data - The updates
 */
async function applySupportedReportsRefresh(
  release: '5' | '5.1',
  dataHostId: string,
  data: RemoteSupportedReport[]
): Promise<void> {
  await dbClient.$transaction([
    // Map data into queries
    ...data.map((item) =>
      dbClient.dataHostSupportedReport.upsert({
        create: {
          ...item,
          dataHostId,
          release,
        },
        update: item,
        where: {
          dataHostId_release_id: {
            dataHostId,
            id: item.id,
            release,
          },
        },
      })
    ),
    // Update refreshedAt
    dbClient.dataHostSupportedRelease.update({
      data: { refreshedAt: new Date() },
      where: { dataHostId_release: { dataHostId, release } },
    }),
  ]);
}

/**
 * Refresh the list of supported reports for a data host
 *
 * @param dataHost - The data host to refresh, with supported data
 * @param auth - The auth to use to fetch remote
 * @param options - The options to use to refresh
 *
 * @returns The list of supported reports
 */
export async function refreshSupportedReportsOfDataHost(
  dataHost: DataHostWithSupportedData,
  auth: HarvestAuthOptions,
  options: SupportedReportsRefreshOptions
): Promise<DataHostSupportedReport[]> {
  const supportedRelease = getSupportedRelease(dataHost, options.release);

  const refresh = options.forceRefresh ?? shouldRefresh(supportedRelease);
  const reportList: ReportListItem[] | null = refresh
    ? await fetchReportList(options.release, {
        auth,
        baseUrl: supportedRelease.baseUrl,
        params: {
          ...dataHost.params,
          ...supportedRelease.params,
        },
        paramsSeparator: dataHost.paramsSeparator,
        userAgent: `Mozilla/5.0 (compatible; ezCOUNTER/api:${appVersion})`,
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
      dataHost.id,
      supportedReports
    );
  }

  // oxlint-disable-next-line no-map-spread
  return supportedReports.map((report) => ({
    // Default values
    createdAt: new Date(),
    firstMonthAvailableOverride: null,
    lastMonthAvailableOverride: null,
    params: {},
    supportedOverride: null,
    // Extracted values
    ...report,
    dataHostId: dataHost.id,
    release: options.release,
    updatedAt: new Date(),
  }));
}
