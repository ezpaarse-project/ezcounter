import type { Prisma } from '@ezcounter/database';

import type { CreateDataHost, CreateDataHostChange } from '../dto';

/**
 * Create data host
 *
 * @param data - The data host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created data host
 */
export const createDataHost = (
  data: CreateDataHost,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostGetPayload<{ include: { changes: true } }>> =>
  tx.dataHost.create({
    data,
    include: {
      changes: true,
    },
  });

/**
 * Create a change on a data host
 *
 * @param data - The change
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created change
 */
export const createDataHostChange = (
  data: CreateDataHostChange,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostChangeGetPayload<null>> =>
  tx.dataHostChange.create({
    data,
  });
