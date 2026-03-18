import { dbClient } from '~/lib/prisma';

import {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  type DataHostWithSupportedData,
  type InputDataHost,
  type InputDataHostSupportedRelease,
  type InputDataHostSupportedReport,
} from './types';

/**
 * Check for the existence of a data host
 *
 * @param id - The id of the host
 *
 * @returns If the host exists
 */
export async function doesDataHostExists(id: string): Promise<boolean> {
  const count = await dbClient.dataHost.count({
    where: { id },
  });

  return count > 0;
}

/**
 * Get all data hosts with pagination options
 *
 * @returns The hosts
 */
export async function findAllDataHost(): Promise<DataHost[]> {
  const hosts = await dbClient.dataHost.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });

  return hosts.map((job) => DataHost.parse(job));
}

/**
 * Check for the support of a release for a data host
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 *
 * @returns If the release is supported by data host
 */
export async function doesDataHostSupportsRelease(
  dataHostId: string,
  release: '5' | '5.1'
): Promise<boolean> {
  const count = await dbClient.dataHostSupportedRelease.count({
    where: {
      dataHostId,
      release,
    },
  });

  return count > 0;
}

/**
 * Get all releases supported by data host
 *
 * @param dataHostId - The id of the host
 *
 * @returns The supported releases
 */
export async function findAllReleasesSupportedByDataHost(
  dataHostId: string
): Promise<DataHostSupportedRelease[]> {
  const releases = await dbClient.dataHostSupportedRelease.findMany({
    where: { dataHostId },
    orderBy: [{ release: 'asc' }],
  });

  return releases.map((release) => DataHostSupportedRelease.parse(release));
}

/**
 * Check for the support of a report for a data host
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 * @param report - The id of the report
 *
 * @returns If the report is supported by data host
 */
export async function doesDataHostSupportsReport(
  dataHostId: string,
  release: '5' | '5.1',
  report: string
): Promise<boolean> {
  const count = await dbClient.dataHostSupportedReport.count({
    where: {
      dataHostId,
      release,
      id: report,
    },
  });

  return count > 0;
}

/**
 * Get all reports supported by data host
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 *
 * @returns The supported reports
 */
export async function findAllReportsSupportedByDataHost(
  dataHostId: string,
  release?: '5' | '5.1'
): Promise<DataHostSupportedReport[]> {
  const reports = await dbClient.dataHostSupportedReport.findMany({
    where: { dataHostId, release },
    orderBy: [{ id: 'asc' }, { release: 'asc' }],
  });

  return reports.map((report) => DataHostSupportedReport.parse(report));
}

/**
 * Get supported data (reports per release) of a data host
 *
 * @param dataHostId - The id of the data host
 *
 * @returns The data supported by endpoint
 */
export async function getDataHostWithSupportedData(
  dataHostId: string
): Promise<DataHostWithSupportedData | null> {
  const item = await dbClient.dataHost.findUnique({
    where: { id: dataHostId },
    include: {
      supportedReleases: {
        include: {
          supportedReports: true,
        },
      },
    },
  });
  if (!item) {
    return null;
  }

  const { supportedReleases, ...dataHost } = item;

  return {
    ...DataHost.parse(dataHost),
    supportedReleases: supportedReleases.map(
      ({ supportedReports, ...release }) =>
        Object.assign(DataHostSupportedRelease.parse(release), {
          supportedReports: supportedReports.map((report) =>
            DataHostSupportedReport.parse(report)
          ),
        })
    ),
  };
}

/**
 * Create or Update data host
 *
 * @param input - The data host
 *
 * @returns The supported release
 */
export async function upsertDataHost(
  input: InputDataHost & {
    id: string;
  }
): Promise<DataHost> {
  const release = await dbClient.dataHost.upsert({
    where: {
      id: input.id,
    },
    update: input,
    create: input,
  });

  return DataHost.parse(release);
}

/**
 * Create or Update supported release of a data host
 *
 * @param input - The release with data host id
 *
 * @returns The supported release
 */
export async function upsertReleaseSupportedByDataHost(
  input: InputDataHostSupportedRelease & {
    dataHostId: string;
    release: '5' | '5.1';
  }
): Promise<DataHostSupportedRelease> {
  const release = await dbClient.dataHostSupportedRelease.upsert({
    where: {
      dataHostId_release: {
        dataHostId: input.dataHostId,
        release: input.release,
      },
    },
    update: input,
    create: input,
  });

  return DataHostSupportedRelease.parse(release);
}

/**
 * Create or Update supported report of a data host
 *
 * @param input - The report with data host id
 *
 * @returns The supported report
 */
export async function upsertReportSupportedByDataHost(
  input: InputDataHostSupportedReport & {
    dataHostId: string;
    release: '5' | '5.1';
    id: string;
  }
): Promise<DataHostSupportedReport> {
  const report = await dbClient.dataHostSupportedReport.upsert({
    where: {
      dataHostId_release_id: {
        dataHostId: input.dataHostId,
        release: input.release,
        id: input.id,
      },
    },
    update: input,
    create: input,
  });

  return DataHostSupportedReport.parse(report);
}

/**
 * Delete registered data host
 *
 * @param id - The id of the host
 *
 * @returns If release supports was removed
 */
export async function deleteDataHost(id: string): Promise<boolean> {
  if (!(await doesDataHostExists(id))) {
    return false;
  }

  await dbClient.dataHost.delete({
    where: {
      id,
    },
  });

  return true;
}

/**
 * Delete supported release of a data host - meaning release is NOT supported
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 *
 * @returns If release supports was removed
 */
export async function deleteReleaseSupportedByDataHost(
  dataHostId: string,
  release: '5' | '5.1'
): Promise<boolean> {
  if (!(await doesDataHostSupportsRelease(dataHostId, release))) {
    return false;
  }

  await dbClient.dataHostSupportedRelease.delete({
    where: {
      dataHostId_release: {
        dataHostId,
        release,
      },
    },
  });

  return true;
}

/**
 * Delete supported release of a data host - meaning release is NOT supported
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 * @param report - The ID of the report
 *
 * @returns If release supports was removed
 */
export async function deleteReportSupportedByDataHost(
  dataHostId: string,
  release: '5' | '5.1',
  report: string
): Promise<boolean> {
  if (!(await doesDataHostSupportsReport(dataHostId, release, report))) {
    return false;
  }

  await dbClient.dataHostSupportedReport.delete({
    where: {
      dataHostId_release_id: {
        dataHostId,
        release,
        id: report,
      },
    },
  });

  return true;
}
