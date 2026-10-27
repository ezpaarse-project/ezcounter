import type { Prisma } from '@ezcounter/database';

import { doesDataHostExists } from './read';

/**
 * Delete registered data host
 *
 * @param id - The id of the host
 * @param client - The DB client (can be a transaction)
 *
 * @returns If release supports was removed
 */
export const deleteDataHost = (
  id: string,
  client: Prisma.TransactionClient
): Promise<boolean> =>
  client.$transaction(async (tx) => {
    if (!(await doesDataHostExists(id, tx))) {
      return false;
    }

    await tx.dataHost.delete({
      where: {
        id,
      },
    });

    return true;
  });
