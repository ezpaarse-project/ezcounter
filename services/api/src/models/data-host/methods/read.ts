import { dbClient } from '~/lib/prisma';

import {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from '../dto';

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
 * Get one reports supported by data host
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 * @param id - The id of the report
 *
 * @returns The supported report or null if not found
 */
export async function findOneReportSupportedByDataHost(
  dataHostId: string,
  release: '5' | '5.1',
  id: string
): Promise<DataHostSupportedReport | null> {
  const report = await dbClient.dataHostSupportedReport.findUnique({
    where: {
      dataHostId_release_id: {
        dataHostId,
        release,
        id,
      },
    },
  });

  if (report) {
    return DataHostSupportedReport.parse(report);
  }
  return null;
}
