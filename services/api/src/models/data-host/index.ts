import { dbClient } from '~/lib/prisma';

import {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  type DataHostWithSupportedData,
} from './types';

/**
 * Get supported data (reports per release) of a data host
 *
 * @param dataHostId - The id of the data host
 *
 * @returns The data supported by endpoint
 */
export async function getDataHostWithSupportedData(
  dataHostId: string
): Promise<DataHostWithSupportedData | null> {
  const item = await dbClient.dataHost.findUnique({
    where: { id: dataHostId },
    include: {
      supportedReleases: {
        include: {
          supportedReports: true,
        },
      },
    },
  });
  if (!item) {
    return null;
  }

  const { supportedReleases, ...dataHost } = item;

  return {
    ...DataHost.parse(dataHost),
    supportedReleases: supportedReleases.map(
      ({ supportedReports, ...release }) =>
        Object.assign(DataHostSupportedRelease.parse(release), {
          supportedReports: supportedReports.map((report) =>
            DataHostSupportedReport.parse(report)
          ),
        })
    ),
  };
}
