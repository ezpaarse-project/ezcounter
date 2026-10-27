import {
  Prisma,
  type RegistrySyncActivity,
  type RegistrySyncHostAction,
} from '@ezcounter/database';

import type { CreateSyncActivity, CreateSyncHostAction } from '../dto';

/**
 * Create sync activity
 *
 * @param data - The sync activity
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created sync activity
 */
export const createSyncActivity = (
  data: CreateSyncActivity,
  tx: Prisma.TransactionClient
): Promise<RegistrySyncActivity> =>
  tx.registrySyncActivity.create({
    data: {
      ...data,
      error: data.error ?? Prisma.DbNull,
    },
  });

/**
 * Create action of sync about host
 *
 * @param data - The action
 * @param tx - The DB client (can be a transaction)
 *
 * @returns The created action
 */
export const createSyncHostAction = (
  data: CreateSyncHostAction,
  tx: Prisma.TransactionClient
): Promise<RegistrySyncHostAction> =>
  tx.registrySyncHostAction.create({
    data,
  });
