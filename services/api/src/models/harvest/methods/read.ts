import type { HarvestJob, Prisma } from '@ezcounter/database';

import type { PaginationParams } from '~/lib/prisma';
import { buildDateFilter } from '~/lib/prisma/utils';

import type { HarvestJobFilters } from '../dto';

/**
 * Build the WHERE clause of a query using filters
 *
 * @param filters - The filters to apply
 *
 * @returns The WHERE clause
 */
const buildWhereClause = (
  filters: HarvestJobFilters
): Prisma.HarvestJobWhereInput => ({
  createdAt: buildDateFilter<HarvestJob>('createdAt', filters),
  dataHostId: filters.dataHostId,
  release: filters.release,
  requestId: filters.requestId,
  startedAt: buildDateFilter<HarvestJob>('startedAt', filters),
  status: filters.status,
  updatedAt: buildDateFilter<HarvestJob>('updatedAt', filters),
});
/**
 * Get all harvest jobs with pagination options
 *
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The harvest jobs matching filters
 */
export function findAllHarvestJob(
  query: PaginationParams & HarvestJobFilters,
  tx: Prisma.TransactionClient
): Promise<HarvestJob[]> {
  const where = buildWhereClause(query);

  return tx.harvestJob.findMany({
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    where,
  });
}

/**
 * Count all harvest jobs available
 *
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of harvest jobs matching filters
 */
export async function countAllHarvestJob(
  query: HarvestJobFilters,
  tx: Prisma.TransactionClient
): Promise<number> {
  const where = buildWhereClause(query);

  const { id: count } = await tx.harvestJob.count({
    select: { id: true },
    where,
  });

  return count;
}

/**
 * Get many Harvest Jobs from ids
 *
 * @param ids - The ids of the jobs
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The jobs
 */
export const findManyHarvestJobById = (
  ids: string[],
  tx: Prisma.TransactionClient
): Promise<HarvestJob[]> =>
  tx.harvestJob.findMany({
    where: {
      id: { in: ids },
    },
  });
