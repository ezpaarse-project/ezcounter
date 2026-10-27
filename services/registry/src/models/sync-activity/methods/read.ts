import type { Prisma, RegistrySyncActivity } from '@ezcounter/database';

import type { PaginationParams } from '~/lib/prisma';

/**
 * Get all data hosts with pagination options
 *
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The hosts
 */
export const findAllSyncActivity = (
  query: PaginationParams,
  tx: Prisma.TransactionClient
): Promise<RegistrySyncActivity[]> =>
  tx.registrySyncActivity.findMany({
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
  });

/**
 * Count all data hosts available
 *
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of data hosts matching filters
 */
export async function countAllSyncActivity(
  query: null,
  tx: Prisma.TransactionClient
): Promise<number> {
  const { id: count } = await tx.registrySyncActivity.count({
    select: { id: true },
  });

  return count;
}

/**
 * Check for the existence of a data host
 *
 * @param id - The id of the host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns If the host exists
 */
export async function doesSyncActivityExists(
  id: string,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const { id: count } = await tx.registrySyncActivity.count({
    select: { id: true },
    where: { id },
  });

  return count > 0;
}

/**
 * Get one data host
 *
 * @param id - The id of the host
 * @param tx - The DB client (can be a transaction)
 * @param includes - The relations to include
 *
 * @returns The host
 */
export const findOneSyncActivity = (
  id: string,
  tx: Prisma.TransactionClient
): Promise<
  Prisma.RegistrySyncActivityGetPayload<{
    include: { hostActions: { include: { dataHost: true } } };
  }>
> =>
  tx.registrySyncActivity.findUniqueOrThrow({
    include: {
      hostActions: {
        include: {
          dataHost: true,
        },
      },
    },
    where: { id },
  });
