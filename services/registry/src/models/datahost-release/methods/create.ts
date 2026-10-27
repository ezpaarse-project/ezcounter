import type { Prisma } from '@ezcounter/database';

import type {
  CreateDataHostRelease,
  CreateDataHostReleaseChange,
} from '../dto';

/**
 * Create release supported by data host
 *
 * @param data - The release
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created release
 */
export const createDataHostRelease = (
  data: CreateDataHostRelease,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReleaseGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostRelease.create({
    data,
    include: {
      changes: true,
    },
  });

/**
 * Create a change on a release supported by data host
 *
 * @param data - The change
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created change
 */
export const createDataHostReleaseChange = (
  data: CreateDataHostReleaseChange,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReleaseChangeGetPayload<null>> =>
  tx.dataHostReleaseChange.create({
    data,
  });
