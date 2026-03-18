import { StatusCodes } from 'http-status-codes';

import {
  doesDataHostExists,
  doesDataHostSupportsRelease,
} from '~/models/data-host';

import { HTTPError } from '~/routes/v1/errors';

/**
 * Shorthand to assert if data host is registered
 *
 * @param id - ID of data host
 *
 * @throws If data host is not registered
 */
export async function assertDataHostRegistered(id: string): Promise<void> {
  if (await doesDataHostExists(id)) {
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
 * @param dataHostId - ID of data host
 * @param release - The release
 *
 * @throws If release is not supported by data host
 */
export async function assertReleaseSupported(
  dataHostId: string,
  release: '5' | '5.1'
): Promise<void> {
  if (await doesDataHostSupportsRelease(dataHostId, release)) {
    return;
  }

  throw new HTTPError(
    StatusCodes.NOT_FOUND,
    `Data host "${dataHostId}" does not supports "${release}"`
  );
}
