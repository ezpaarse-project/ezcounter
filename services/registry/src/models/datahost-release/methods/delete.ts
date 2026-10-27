import type { Prisma } from '@ezcounter/database';

import type { DataHostReleaseID } from '../dto';
import { doesDataHostReleaseExists } from './read';

/**
 * Delete registered release supported by data host
 *
 * @param id - The id of the host
 * @param client - The DB client (can be a transaction)
 *
 * @returns If release support was removed
 */
export const deleteDataHostRelease = (
  id: DataHostReleaseID,
  client: Prisma.TransactionClient
): Promise<boolean> =>
  client.$transaction(async (tx) => {
    if (!(await doesDataHostReleaseExists(id, tx))) {
      return false;
    }

    await tx.dataHostRelease.delete({
      where: {
        dataHostId_release: {
          dataHostId: id.dataHostId,
          release: id.release,
        },
      },
    });

    return true;
  });
