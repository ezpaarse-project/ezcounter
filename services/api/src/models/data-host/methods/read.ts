import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  Prisma,
} from '@ezcounter/database';

import type { PaginationParams } from '~/lib/prisma';
import { buildDateFilter } from '~/lib/prisma/utils';

import type {
  DataHostFilters,
  DataHostSupportedReleaseFilters,
  DataHostSupportedReleaseID,
  DataHostSupportedReportFilters,
  DataHostSupportedReportID,
} from '../dto';

/**
 * Build the WHERE clause of a query using filters
 *
 * @param filters - The filters to apply
 *
 * @returns The WHERE clause
 */
const buildWhereDataHostClause = (
  filters: DataHostFilters
): Prisma.DataHostWhereInput => ({
  createdAt: buildDateFilter<DataHost>('createdAt', filters),
  updatedAt: buildDateFilter<DataHost>('updatedAt', filters),
});

/**
 * Build the WHERE clause of a query using filters
 *
 * @param filters - The filters to apply
 *
 * @returns The WHERE clause
 */
const buildWhereReleaseClause = (
  filters: DataHostSupportedReleaseFilters
): Prisma.DataHostSupportedReleaseWhereInput => ({
  createdAt: buildDateFilter<DataHostSupportedRelease>('createdAt', filters),
  updatedAt: buildDateFilter<DataHostSupportedRelease>('updatedAt', filters),
});

/**
 * Build the WHERE clause of a query using filters
 *
 * @param filters - The filters to apply
 *
 * @returns The WHERE clause
 */
const buildWhereReportClause = (
  filters: DataHostSupportedReportFilters
): Prisma.DataHostSupportedReportWhereInput => ({
  createdAt: buildDateFilter<DataHostSupportedReport>('createdAt', filters),
  supported: filters.supported,
  updatedAt: buildDateFilter<DataHostSupportedReport>('updatedAt', filters),
});

/**
 * Check for the existence of a data host
 *
 * @param id - The id of the host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns If the host exists
 */
export async function doesDataHostExists(
  id: string,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const { id: count } = await tx.dataHost.count({
    select: { id: true },
    where: { id },
  });

  return count > 0;
}

/**
 * Get all data hosts with pagination options
 *
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The hosts
 */
export function findAllDataHost(
  query: PaginationParams & DataHostFilters,
  tx: Prisma.TransactionClient
): Promise<DataHost[]> {
  const where = buildWhereDataHostClause(query);

  return tx.dataHost.findMany({
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    where,
  });
}

/**
 * Count all data hosts available
 *
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of data hosts matching filters
 */
export async function countAllDataHost(
  query: DataHostFilters,
  tx: Prisma.TransactionClient
): Promise<number> {
  const where = buildWhereDataHostClause(query);

  const { id: count } = await tx.dataHost.count({
    select: { id: true },
    where,
  });

  return count;
}

/**
 * Get one data host
 *
 * @param id - The id of the host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The host
 */
export const findOneDataHost = (
  id: string,
  tx: Prisma.TransactionClient
): Promise<DataHost> =>
  tx.dataHost.findUniqueOrThrow({
    where: { id },
  });

/**
 * Check for the support of a release for a data host
 *
 * @param id - The id of release
 * @param tx - The DB client (can be a transaction)
 *
 * @returns If the release is supported by data host
 */
export async function doesDataHostSupportsRelease(
  id: DataHostSupportedReleaseID,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const { release: count } = await tx.dataHostSupportedRelease.count({
    select: { release: true },
    where: id,
  });

  return count > 0;
}

/**
 * Get all releases supported by data host
 *
 * @param dataHostId - The id of the host
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported releases
 */
export function findAllReleasesSupportedByDataHost(
  dataHostId: string,
  query: PaginationParams & DataHostSupportedReleaseFilters,
  tx: Prisma.TransactionClient
): Promise<DataHostSupportedRelease[]> {
  const where = buildWhereReleaseClause(query);
  where.dataHostId = dataHostId;

  return tx.dataHostSupportedRelease.findMany({
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    where,
  });
}

/**
 * Count all releases supported by data host
 *
 * @param dataHostId - The id of the host
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of releases matching filters
 */
export async function countAllReleasesSupportedByDataHost(
  dataHostId: string,
  query: DataHostSupportedReleaseFilters,
  tx: Prisma.TransactionClient
): Promise<number> {
  const where = buildWhereReleaseClause(query);
  where.dataHostId = dataHostId;

  const { release: count } = await tx.dataHostSupportedRelease.count({
    select: { release: true },
    where,
  });

  return count;
}

/**
 * Get supported release by data host ID - assume that DataHost AND SupportedRelease exists
 *
 * @see `doesDataHostExists`
 * @see `doesDataHostSupportsRelease`
 *
 * @param id - The id of release
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported release
 */
export const findOneReleaseSupportedByDataHost = (
  id: DataHostSupportedReleaseID,
  tx: Prisma.TransactionClient
): Promise<DataHostSupportedRelease> =>
  tx.dataHostSupportedRelease.findUniqueOrThrow({
    where: {
      dataHostId_release: { dataHostId: id.dataHostId, release: id.release },
    },
  });

/**
 * Check for the support of a report for a data host
 *
 * @param id - The id of report
 * @param tx - The DB client (can be a transaction)
 *
 * @returns If the report is supported by data host
 */
export async function doesDataHostSupportsReport(
  id: DataHostSupportedReportID,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const count = await tx.dataHostSupportedReport.count({
    where: {
      dataHostId: id.dataHostId,
      id: id.report,
      release: id.release,
    },
  });

  return count > 0;
}

/**
 * Get all reports supported by data host
 *
 * @param releaseId - The id of release
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported reports
 */
export function findAllReportsSupportedByDataHost(
  releaseId: DataHostSupportedReleaseID,
  query: PaginationParams & DataHostSupportedReportFilters,
  tx: Prisma.TransactionClient
): Promise<DataHostSupportedReport[]> {
  const where = buildWhereReportClause(query);
  where.dataHostId = releaseId.dataHostId;
  where.release = releaseId.release;

  return tx.dataHostSupportedReport.findMany({
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    where,
  });
}

/**
 * Count all reports supported by data host
 *
 * @param releaseId - The id of release
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of reports matching filters
 */
export async function countAllReportsSupportedByDataHost(
  releaseId: DataHostSupportedReleaseID,
  query: DataHostSupportedReportFilters,
  tx: Prisma.TransactionClient
): Promise<number> {
  const where = buildWhereReportClause(query);
  where.dataHostId = releaseId.dataHostId;
  where.release = releaseId.release;

  const { id: count } = await tx.dataHostSupportedReport.count({
    select: { id: true },
    where,
  });

  return count;
}

/**
 * Get one reports supported by data host
 *
 * @param id - The id of report
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported report or null if not found
 */
export const findOneReportSupportedByDataHost = (
  id: DataHostSupportedReportID,
  tx: Prisma.TransactionClient
): Promise<DataHostSupportedReport> =>
  tx.dataHostSupportedReport.findUniqueOrThrow({
    where: {
      dataHostId_release_id: {
        dataHostId: id.dataHostId,
        id: id.report,
        release: id.release,
      },
    },
  });

/**
 * Get supported data (reports per release) of a data host
 *
 * @param id - The id of the data host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The data host with supported data
 */
export const findOneDataHostWithSupportedData = (
  id: string,
  tx: Prisma.TransactionClient
): Promise<
  Prisma.DataHostGetPayload<{
    include: { supportedReleases: { include: { supportedReports: true } } };
  }>
> =>
  tx.dataHost.findUniqueOrThrow({
    include: {
      supportedReleases: {
        include: {
          supportedReports: true,
        },
      },
    },
    where: { id },
  });
