import { dbClient } from '~/lib/prisma';

import {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  type CreateDataHost,
  type CreateDataHostSupportedRelease,
  type CreateDataHostSupportedReport,
} from '../dto';

/**
 * Create or Update data host
 *
 * @param input - The data host
 *
 * @returns The supported release
 */
export async function upsertDataHost(input: CreateDataHost): Promise<DataHost> {
  const release = await dbClient.dataHost.upsert({
    where: {
      id: input.id,
    },
    update: input,
    create: input,
  });

  return DataHost.parse(release);
}

/**
 * Create or Update supported release of a data host
 *
 * @param input - The release with data host id
 *
 * @returns The supported release
 */
export async function upsertReleaseSupportedByDataHost(
  input: CreateDataHostSupportedRelease
): Promise<DataHostSupportedRelease> {
  const release = await dbClient.dataHostSupportedRelease.upsert({
    where: {
      dataHostId_release: {
        dataHostId: input.dataHostId,
        release: input.release,
      },
    },
    update: input,
    create: input,
  });

  return DataHostSupportedRelease.parse(release);
}

/**
 * Create or Update supported report of a data host
 *
 * @param input - The report with data host id
 *
 * @returns The supported report
 */
export async function upsertReportSupportedByDataHost(
  input: CreateDataHostSupportedReport
): Promise<DataHostSupportedReport> {
  const report = await dbClient.dataHostSupportedReport.upsert({
    where: {
      dataHostId_release_id: {
        dataHostId: input.dataHostId,
        release: input.release,
        id: input.id,
      },
    },
    update: input,
    create: input,
  });

  return DataHostSupportedReport.parse(report);
}
