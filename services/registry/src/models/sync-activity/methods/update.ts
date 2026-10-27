import {
  Prisma,
  type RegistrySyncActivity,
  type RegistrySyncHostAction,
} from '@ezcounter/database';

import type { DataHostID } from '~/models/datahost/dto';
import type { DiffEntry } from '~/models/diff/dto';

import type { UpdateSyncActivity } from '../dto';

/**
 * Update sync activity
 *
 * @param data - The sync activity
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The updated sync activity
 */
export const updateSyncActivity = (
  data: Partial<UpdateSyncActivity> & { id: string },
  tx: Prisma.TransactionClient
): Promise<RegistrySyncActivity> =>
  tx.registrySyncActivity.update({
    data: {
      ...data,
      error: data.error ?? Prisma.DbNull,
    },
    where: {
      id: data.id,
    },
  });

/**
 * Add diff entries to action of sync about host
 *
 * @param data - The action diff
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created action
 */
export const addDiffToSyncHostAction = (
  data: {
    syncId: string;
    dataHostId: DataHostID;
    diff: DiffEntry[];
  },
  tx: Prisma.TransactionClient
): Promise<RegistrySyncHostAction> =>
  tx.registrySyncHostAction.update({
    data: {
      diff: {
        push: data.diff,
      },
    },
    where: {
      syncId_dataHostId: {
        dataHostId: data.dataHostId,
        syncId: data.syncId,
      },
    },
  });
