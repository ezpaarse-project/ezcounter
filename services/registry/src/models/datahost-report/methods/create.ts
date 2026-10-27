import type { Prisma } from '@ezcounter/database';

import type { CreateDataHostReport, CreateDataHostReportChange } from '../dto';

/**
 * Create report supported by data host
 *
 * @param data - The report
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created report
 */
export const createDataHostReport = (
  data: CreateDataHostReport,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReportGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostReport.create({
    data,
    include: {
      changes: true,
    },
  });

/**
 * Create a change on a report supported by data host
 *
 * @param data - The change
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created change
 */
export const createDataHostReportChange = (
  data: CreateDataHostReportChange,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReportChangeGetPayload<null>> =>
  tx.dataHostReportChange.create({
    data,
  });
