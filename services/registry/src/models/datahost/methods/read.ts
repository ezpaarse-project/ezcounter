import type { Prisma } from '@ezcounter/database';

import type { PaginationParams } from '~/lib/prisma';

/**
 * Get all data hosts with pagination options
 *
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The hosts
 */
export const findAllDataHost = (
  query: PaginationParams,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostGetPayload<{ include: { changes: true } }>[]> =>
  tx.dataHost.findMany({
    include: {
      changes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
  });

/**
 * Scroll through all data hosts with pagination options
 *
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @yields The hosts
 */
export async function* scrollAllDataHosts(
  query: Omit<PaginationParams, 'skip'>,
  tx: Prisma.TransactionClient
): AsyncGenerator<
  Prisma.DataHostGetPayload<{ include: { changes: true } }>,
  void,
  unknown
> {
  // oxlint-disable-next-line no-magic-numbers
  const take = query.take || 10;
  let skip = 0;

  while (true) {
    // oxlint-disable-next-line no-await-in-loop
    const hosts = await tx.dataHost.findMany({
      include: {
        changes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: query.orderBy || { createdAt: 'asc' },
      skip,
      take,
    });

    if (hosts.length === 0) {
      break;
    }

    yield* hosts;

    skip += take;
  }
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
  query: null,
  tx: Prisma.TransactionClient
): Promise<number> {
  const { id: count } = await tx.dataHost.count({
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
 * Get one data host
 *
 * @param id - The id of the host
 * @param tx - The DB client (can be a transaction)
 * @param includes - The relations to include
 *
 * @returns The host
 */
export const findOneDataHost = (
  id: string,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostGetPayload<{ include: { changes: true } }>> =>
  tx.dataHost.findUniqueOrThrow({
    include: {
      changes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    where: { id },
  });
