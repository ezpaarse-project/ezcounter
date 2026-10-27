import type { Prisma } from '@ezcounter/database';

import type { PaginationParams } from '~/lib/prisma';

import type { DataHostID } from '~/models/datahost/dto';

import type { DataHostReleaseID } from '../dto';

/**
 * Get all releases supported by a data host with pagination options
 *
 * @param dataHostId - The id of the host
 * @param query - Filters and pagination to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The releases
 */
export const findAllDataHostRelease = (
  dataHostId: DataHostID,
  query: PaginationParams,
  tx: Prisma.TransactionClient
): Promise<
  Prisma.DataHostReleaseGetPayload<{ include: { changes: true } }>[]
> =>
  tx.dataHostRelease.findMany({
    include: {
      changes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    where: {
      dataHostId,
    },
  });

/**
 * Count all releases supported by a data host
 *
 * @param dataHostId - The id of the host
 * @param query - Filters to apply (if any)
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The count of releases matching filters
 */
export async function countAllDataHostRelease(
  dataHostId: DataHostID,
  query: null,
  tx: Prisma.TransactionClient
): Promise<number> {
  const { release: count } = await tx.dataHostRelease.count({
    select: { release: true },
    where: {
      dataHostId,
    },
  });

  return count;
}

/**
 * Check for the existence of a release supported by a data host
 *
 * @param id - The id of the release
 * @param tx - The DB client (can be a transaction)
 *
 * @returns If the release is supported
 */
export async function doesDataHostReleaseExists(
  id: DataHostReleaseID,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const { release: count } = await tx.dataHostRelease.count({
    select: { release: true },
    where: {
      dataHostId: id.dataHostId,
      release: id.release,
    },
  });

  return count > 0;
}

/**
 * Get one release supported by a data host
 *
 * @param id - The id of the release
 * @param tx - The DB client (can be a transaction)
 * @param includes - The relations to include
 *
 * @returns The release
 */
export const findOneDataHostRelease = (
  id: DataHostReleaseID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReleaseGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostRelease.findUniqueOrThrow({
    include: {
      changes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    where: {
      dataHostId_release: {
        dataHostId: id.dataHostId,
        release: id.release,
      },
    },
  });
