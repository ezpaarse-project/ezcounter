import type { Prisma } from '@ezcounter/database';

import { doesSyncActivityExists } from './read';

/**
 * Delete registered data host
 *
 * @param id - The id of the host
 * @param client - The DB client (can be a transaction)
 *
 * @returns If release supports was removed
 */
export const deleteSyncActivity = (
  id: string,
  client: Prisma.TransactionClient
): Promise<boolean> =>
  client.$transaction(async (tx) => {
    if (!(await doesSyncActivityExists(id, tx))) {
      return false;
    }

    await tx.registrySyncActivity.delete({
      where: {
        id,
      },
    });

    return true;
  });
