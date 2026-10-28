import type { Prisma } from '@ezcounter/database';

import type { PaginationParams } from '~/lib/prisma';

import type { DataHostReleaseID } from '~/models/datahost-release/dto';

import type { DataHostReportID } from '../dto';

/**
 * Get all reports supported by a data host for a given release with pagination options
 *
 * @param releaseId - The id of the release
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The reports
 */
export const findAllDataHostReport = (
  releaseId: DataHostReleaseID,
  query: PaginationParams,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReportGetPayload<{ include: { changes: true } }>[]> =>
  tx.dataHostReport.findMany({
    include: {
      changes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    where: {
      dataHostId: releaseId.dataHostId,
      release: releaseId.release,
    },
  });

/**
 * Count all reports supported by a data host for a given release
 *
 * @param releaseId - The id of the report
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of reports matching filters
 */
export async function countAllDataHostReport(
  releaseId: DataHostReleaseID,
  query: null,
  tx: Prisma.TransactionClient
): Promise<number> {
  const { reportId: count } = await tx.dataHostReport.count({
    select: { reportId: true },
    where: {
      dataHostId: releaseId.dataHostId,
      release: releaseId.release,
    },
  });

  return count;
}

/**
 * Check for the existence of a report supported by a data host for a given release
 *
 * @param id - The id of the report
 * @param tx - The DB client (can be a transaction)
 *
 * @returns If the report is supported
 */
export async function doesDataHostReportExists(
  id: DataHostReportID,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const { reportId: count } = await tx.dataHostReport.count({
    select: { reportId: true },
    where: {
      dataHostId: id.dataHostId,
      release: id.release,
      reportId: id.reportId,
    },
  });

  return count > 0;
}

/**
 * Get one report supported by a data host for a given release
 *
 * @param id - The id of the report
 * @param tx - The DB client (can be a transaction)
 * @param includes - The relations to include
 *
 * @returns The report
 */
export const findOneDataHostReport = (
  id: DataHostReportID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReportGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostReport.findUniqueOrThrow({
    include: {
      changes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    where: {
      dataHostId_release_reportId: {
        dataHostId: id.dataHostId,
        release: id.release,
        reportId: id.reportId,
      },
    },
  });
