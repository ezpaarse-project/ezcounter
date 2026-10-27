import type { Prisma } from '@ezcounter/database';

import type { DataHostReportID } from '../dto';
import { doesDataHostReportExists } from './read';

/**
 * Delete registered release supported by data host
 *
 * @param id - The id of the host
 * @param client - The DB client (can be a transaction)
 *
 * @returns If release support was removed
 */
export const deleteDataHostReport = (
  id: DataHostReportID,
  client: Prisma.TransactionClient
): Promise<boolean> =>
  client.$transaction(async (tx) => {
    if (!(await doesDataHostReportExists(id, tx))) {
      return false;
    }

    await tx.dataHostReport.delete({
      where: {
        dataHostId_release_reportId: {
          dataHostId: id.dataHostId,
          release: id.release,
          reportId: id.reportId,
        },
      },
    });

    return true;
  });
