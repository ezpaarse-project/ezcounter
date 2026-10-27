import type { DataHostRelease, Prisma } from '@ezcounter/database';

import type { DataHostReleaseID } from '../dto';

/**
 * Update a release supported by a data host
 *
 * @param data - The release
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated release
 */
export const updateDataHostRelease = (
  data: Partial<DataHostRelease> & DataHostReleaseID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReleaseGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostRelease.update({
    data: {
      ...data,
      params: data.params == null ? undefined : data.params,
      requiredAuth: data.requiredAuth == null ? undefined : data.requiredAuth,
    },
    include: {
      changes: true,
    },
    where: {
      dataHostId_release: {
        dataHostId: data.dataHostId,
        release: data.release,
      },
    },
  });

/**
 * Mark a release as unsupported by the data host
 *
 * @param id - The release id
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated release
 */
export const unsupportDataHostRelease = (
  id: DataHostReleaseID,
  tx: Prisma.TransactionClient
): Promise<Prisma.DataHostReleaseGetPayload<{ include: { changes: true } }>> =>
  tx.dataHostRelease.update({
    data: {
      supported: false,
    },
    include: {
      changes: true,
    },
    where: {
      dataHostId_release: {
        dataHostId: id.dataHostId,
        release: id.release,
      },
    },
  });
