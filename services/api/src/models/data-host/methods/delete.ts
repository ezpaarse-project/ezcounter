import type { Prisma } from '@ezcounter/database';

import {
  doesDataHostExists,
  doesDataHostSupportsRelease,
  doesDataHostSupportsReport,
} from './read';

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

/**
 * Delete supported release of a data host - meaning release is NOT supported
 *
 * @param id - The id of the release
 * @param client - The DB client (can be a transaction)
 *
 * @returns If release supports was removed
 */
export const deleteReleaseSupportedByDataHost = (
  id: {
    dataHostId: string;
    release: '5' | '5.1';
  },
  client: Prisma.TransactionClient
): Promise<boolean> =>
  client.$transaction(async (tx) => {
    if (!(await doesDataHostSupportsRelease(id, tx))) {
      return false;
    }

    await tx.dataHostSupportedRelease.delete({
      where: {
        dataHostId_release: {
          dataHostId: id.dataHostId,
          release: id.release,
        },
      },
    });

    return true;
  });

/**
 * Delete supported release of a data host - meaning release is NOT supported
 *
 * @param id - The id of the report
 * @param client - The DB client (can be a transaction)
 *
 * @returns If release supports was removed
 */
export const deleteReportSupportedByDataHost = (
  id: {
    dataHostId: string;
    release: '5' | '5.1';
    report: string;
  },
  client: Prisma.TransactionClient
): Promise<boolean> =>
  client.$transaction(async (tx) => {
    if (!(await doesDataHostSupportsReport(id, tx))) {
      return false;
    }

    await tx.dataHostSupportedReport.delete({
      where: {
        dataHostId_release_id: {
          dataHostId: id.dataHostId,
          id: id.report,
          release: id.release,
        },
      },
    });

    return true;
  });
