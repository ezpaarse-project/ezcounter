import { omit } from 'es-toolkit/object';

import type { DataHost, Prisma } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import type { DiffEntry } from '~/models/diff/dto';
import {
  createDataHost,
  doesDataHostExists,
  findOneDataHost,
  scrollAllDataHosts,
  unlinkDataHost,
  updateDataHost,
} from '~/models/datahost/methods';
import { areHashEqual, objectDiff } from '~/models/diff/methods';
import { createSyncHostAction } from '~/models/sync-activity/methods';

import type { DataHostSync } from '../dto';
import type { ISyncRemote } from '../remotes/types';
import { syncHostReleases } from './releases';

/**
 * Shorthand to resolve diff between 2 version of a host
 *
 * @param host1 The first host
 * @param host2 The second host
 *
 * @returns The diff
 */
const resolveDiff = (
  host1: Record<string, unknown>,
  host2: Record<string, unknown>
): DiffEntry[] =>
  objectDiff(
    omit(host1, ['createdAt', 'updatedAt', 'changes']),
    omit(host2, ['createdAt', 'updatedAt', 'changes'])
  );
/**
 * Create or update host from source data
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param host - The sync data
 *
 * @returns Promise resolving when host is synced
 */
const upsertHost = (syncId: string, host: DataHostSync): Promise<DataHost> =>
  dbClient.$transaction(async (tx) => {
    // Create if doesn't exists
    const exists = await doesDataHostExists(host.id, tx);
    if (!exists) {
      const created = await createDataHost(host, tx);
      await createSyncHostAction(
        {
          dataHostId: created.id,
          diff: resolveDiff({}, host),
          syncId,
          type: 'created',
        },
        tx
      );

      return created;
    }

    // Skip if nothing changed
    const data = await findOneDataHost(host.id, tx);
    if (areHashEqual(data, host)) {
      return data;
    }

    // Apply changes
    const updated = await updateDataHost(host, tx);
    await createSyncHostAction(
      {
        dataHostId: data.id,
        diff: resolveDiff(data, updated),
        syncId,
        type: 'updated',
      },
      tx
    );

    return updated;
  });

/**
 * Delete (mark as local) host
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param host - The host
 * @param tx - The db client
 *
 * @returns Promise resolving when host is synced
 */
async function deleteDataHost(
  syncId: string,
  host: DataHost,
  tx: Prisma.TransactionClient
): Promise<void> {
  const updated = await unlinkDataHost(host.id, tx);

  await createSyncHostAction(
    {
      dataHostId: host.id,
      diff: resolveDiff(host, updated),
      syncId,
      type: 'unlinked',
    },
    tx
  );
}

/**
 * Sync hosts and their supported data from source
 *
 * @param remote - The remote to sync
 * @param syncId - The id of the sync
 */
export async function syncHosts(
  remote: ISyncRemote,
  syncId: string
): Promise<void> {
  if (!remote) {
    throw new Error('No remote is set');
  }

  const syncedHosts = new Set<string>();

  // Add new/existing data
  for await (const host of remote.fetchHostSyncData()) {
    await upsertHost(syncId, host);
    await syncHostReleases(syncId, host);
    syncedHosts.add(host.id);
  }

  // Clean old data
  await dbClient.$transaction(async (tx) => {
    const hosts = scrollAllDataHosts({}, tx);
    for await (const host of hosts) {
      if (!syncedHosts.has(host.id) && host.local === false) {
        await deleteDataHost(syncId, host, tx);
      }
    }
  });
}
