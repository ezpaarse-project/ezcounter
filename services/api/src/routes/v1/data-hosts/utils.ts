import { StatusCodes } from 'http-status-codes';

import { DataHostModel } from '~/models/data-host';

import { HTTPError } from '~/routes/v1/errors';

/**
 * Shorthand to assert if data host is registered
 *
 * @param id - ID of data host
 * @param model - Previous instance of DataHostModel
 *
 * @throws {HTTPError} If data host is not registered
 */
export async function assertDataHostRegistered(
  id: string,
  model?: DataHostModel
): Promise<void> {
  const dataHosts = model ?? new DataHostModel();

  if (await dataHosts.doesExists(id)) {
    return;
  }

  throw new HTTPError(
    StatusCodes.NOT_FOUND,
    `Data host "${id}" is not registered`
  );
}

/**
 * Shorthand to assert if release is supported
 *
 * @param id - ID of release
 * @param model - Previous instance of DataHostModel
 *
 * @throws {HTTPError} If data host is not registered
 * @throws {HTTPError} If release is not supported by data host
 */
export async function assertReleaseSupported(
  id: { dataHostId: string; release: '5' | '5.1' },
  model?: DataHostModel
): Promise<void> {
  const dataHosts = model ?? new DataHostModel();

  await assertDataHostRegistered(id.dataHostId, model);

  if (await dataHosts.doesSupportsRelease(id)) {
    return;
  }

  throw new HTTPError(
    StatusCodes.NOT_FOUND,
    `Data host "${id.dataHostId}" does not supports "${id.release}"`
  );
}
