import type { Prisma } from '@ezcounter/database';

import type { DataHostReportID, UpdateDataHostReport } from '../dto';

/**
 * Update a report supported by a data host
 *
 * @param data - The report
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated report
 */
export const updateDataHostReport = (
  data: Partial<UpdateDataHostReport> & DataHostReportID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReportGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostReport.update({
    data,
    include: {
      changes: true,
    },
    where: {
      dataHostId_release_reportId: {
        dataHostId: data.dataHostId,
        release: data.release,
        reportId: data.reportId,
      },
    },
  });

/**
 * Mark a report as unsupported by the data host
 *
 * @param id - The report id
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated report
 */
export const unsupportDataHostReport = (
  id: DataHostReportID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReportGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostReport.update({
    data: {
      supported: false,
    },
    include: {
      changes: true,
    },
    where: {
      dataHostId_release_reportId: {
        dataHostId: id.dataHostId,
        release: id.release,
        reportId: id.reportId,
      },
    },
  });
