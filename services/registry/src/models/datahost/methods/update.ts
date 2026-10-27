import { createId as cuid2 } from '@paralleldrive/cuid2';

import type { Prisma } from '@ezcounter/database';

import type { DataHostID, UpdateDataHost } from '../dto';

/**
 * Update data host
 *
 * @param data - The data host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated data host
 */
export const updateDataHost = (
  data: Partial<UpdateDataHost> & { id: DataHostID },
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostGetPayload<{ include: { changes: true } }>> =>
  tx.dataHost.update({
    data,
    include: {
      changes: true,
    },
    where: {
      id: data.id,
    },
  });

/**
 * Make a data host local only
 *
 * @param id - The data host's id
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated data host
 */
export const unlinkDataHost = (
  id: DataHostID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostGetPayload<{ include: { changes: true } }>> =>
  tx.dataHost.update({
    data: {
      id: cuid2(),
      local: true,
    },
    include: {
      changes: true,
    },
    where: { id },
  });
