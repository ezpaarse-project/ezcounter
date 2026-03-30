import { dbClient } from '~/lib/prisma';

import {
  doesDataHostExists,
  doesDataHostSupportsRelease,
  doesDataHostSupportsReport,
} from './read';

/**
 * Delete registered data host
 *
 * @param id - The id of the host
 *
 * @returns If release supports was removed
 */
export async function deleteDataHost(id: string): Promise<boolean> {
  if (!(await doesDataHostExists(id))) {
    return false;
  }

  await dbClient.dataHost.delete({
    where: {
      id,
    },
  });

  return true;
}

/**
 * Delete supported release of a data host - meaning release is NOT supported
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 *
 * @returns If release supports was removed
 */
export async function deleteReleaseSupportedByDataHost(
  dataHostId: string,
  release: '5' | '5.1'
): Promise<boolean> {
  if (!(await doesDataHostSupportsRelease(dataHostId, release))) {
    return false;
  }

  await dbClient.dataHostSupportedRelease.delete({
    where: {
      dataHostId_release: {
        dataHostId,
        release,
      },
    },
  });

  return true;
}

/**
 * Delete supported release of a data host - meaning release is NOT supported
 *
 * @param dataHostId - The id of the host
 * @param release - The release of the report
 * @param report - The ID of the report
 *
 * @returns If release supports was removed
 */
export async function deleteReportSupportedByDataHost(
  dataHostId: string,
  release: '5' | '5.1',
  report: string
): Promise<boolean> {
  if (!(await doesDataHostSupportsReport(dataHostId, release, report))) {
    return false;
  }

  await dbClient.dataHostSupportedReport.delete({
    where: {
      dataHostId_release_id: {
        dataHostId,
        id: report,
        release,
      },
    },
  });

  return true;
}
