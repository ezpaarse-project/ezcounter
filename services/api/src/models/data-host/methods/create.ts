import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  Prisma,
} from '@ezcounter/database';

import type {
  CreateDataHost,
  CreateDataHostSupportedRelease,
  CreateDataHostSupportedReport,
} from '../dto';

/**
 * Create or Update data host
 *
 * @param input - The data host
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported release
 */
export const upsertDataHost = (
  input: CreateDataHost,
  tx: Prisma.TransactionClient
): Promise<DataHost> =>
  tx.dataHost.upsert({
    create: input,
    update: input,
    where: {
      id: input.id,
    },
  });

/**
 * Create or Update supported release of a data host
 *
 * @param input - The release with data host id
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported release
 */
export const upsertReleaseSupportedByDataHost = (
  input: CreateDataHostSupportedRelease,
  tx: Prisma.TransactionClient
): Promise<DataHostSupportedRelease> =>
  tx.dataHostSupportedRelease.upsert({
    create: input,
    update: input,
    where: {
      dataHostId_release: {
        dataHostId: input.dataHostId,
        release: input.release,
      },
    },
  });

/**
 * Create or Update supported report of a data host
 *
 * @param input - The report with data host id
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The supported report
 */
export const upsertReportSupportedByDataHost = (
  input: CreateDataHostSupportedReport,
  tx: Prisma.TransactionClient
): Promise<DataHostSupportedReport> =>
  tx.dataHostSupportedReport.upsert({
    create: input,
    update: input,
    where: {
      dataHostId_release_id: {
        dataHostId: input.dataHostId,
        id: input.id,
        release: input.release,
      },
    },
  });
