import { StatusCodes } from 'http-status-codes';

import type { DataHostReleaseID } from '~/models/datahost-release/dto';
import type { DataHostReportID } from '~/models/datahost-report/dto';
import { DataHostModel } from '~/models/datahost';
import { DataHostReleaseModel } from '~/models/datahost-release';
import { DataHostReportModel } from '~/models/datahost-report/__mocks__';

import { HTTPError } from '~/routes/v1/shared/errors';

/**
 * Shorthand to assert if data host is registered
 *
 * @param id - ID of data host
 *
 * @throws {HTTPError} If data host is not registered
 */
export async function assertDataHostRegistered(id: string): Promise<void> {
  const dataHosts = new DataHostModel();

  if (await dataHosts.doesExists(id)) {
    return;
  }

  throw new HTTPError(
    StatusCodes.NOT_FOUND,
    `Data host "${id}" is not registered`
  );
}

/**
 * Shorthand to assert if release is registered
 *
 * @param id - ID of release
 *
 * @throws {HTTPError} If data host is not registered
 * @throws {HTTPError} If release is not registered by data host
 */
export async function assertReleaseRegistered(
  id: DataHostReleaseID
): Promise<void> {
  const releases = new DataHostReleaseModel();

  await assertDataHostRegistered(id.dataHostId);

  if (await releases.doesExists(id)) {
    return;
  }

  throw new HTTPError(
    StatusCodes.NOT_FOUND,
    `Release "${id.release}" is not registered for data host "${id.dataHostId}"`
  );
}

/**
 * Shorthand to assert if report is registered
 *
 * @param id - ID of report
 *
 * @throws {HTTPError} If data host is not registered
 * @throws {HTTPError} If report is not registered by data host
 */
export async function assertReportRegistered(
  id: DataHostReportID
): Promise<void> {
  const reports = new DataHostReportModel();

  await assertReleaseRegistered(id);

  if (await reports.doesExists(id)) {
    return;
  }

  throw new HTTPError(
    StatusCodes.NOT_FOUND,
    `Report "${id.reportId}" is not registered for release "${id.release}" of data host "${id.dataHostId}"`
  );
}
