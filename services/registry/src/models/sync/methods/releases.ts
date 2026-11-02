import { omit } from 'es-toolkit';

import type { DataHostRelease, Prisma } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import type { DiffEntry } from '~/models/diff/dto';
import {
  createDataHostRelease,
  doesDataHostReleaseExists,
  findAllDataHostRelease,
  findOneDataHostRelease,
  unsupportDataHostRelease,
  updateDataHostRelease,
} from '~/models/datahost-release/methods';
import { areHashEqual, objectDiff } from '~/models/diff/methods';
import { addDiffToSyncHostAction } from '~/models/sync-activity/methods';

import type { DataHostReleaseSync, DataHostSync } from '../dto';
import { syncHostReports } from './reports';

/**
 * Shorthand to resolve diff between 2 version of a release
 *
 * @param rel1 The first release
 * @param rel2 The second release
 *
 * @returns The diff
 */
const resolveDiff = (
  rel1: Record<string, unknown>,
  rel2: Record<string, unknown>
): DiffEntry[] =>
  objectDiff(
    {
      [`availableReleases.${rel1.release}`]: omit(rel1, [
        'createdAt',
        'updatedAt',
        'changes',
      ]),
    },
    {
      [`availableReleases.${rel2.release}`]: omit(rel2, [
        'createdAt',
        'updatedAt',
        'changes',
      ]),
    }
  );

/**
 * Create or update release for host from source data
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param release - The sync data
 *
 * @returns Promise resolving when release is synced
 */
const upsertHostRelease = (
  syncId: string,
  release: DataHostReleaseSync
): Promise<DataHostRelease> =>
  dbClient.$transaction(async (tx) => {
    const releaseId = {
      dataHostId: release.dataHostId,
      release: release.release,
    };

    // Create if doesn't exists
    const exists = await doesDataHostReleaseExists(releaseId, tx);
    if (!exists) {
      const created = await createDataHostRelease(release, tx);
      await addDiffToSyncHostAction(
        {
          dataHostId: release.dataHostId,
          diff: resolveDiff({}, created),
          syncId,
        },
        tx
      );

      return created;
    }

    // Skip if nothing changed
    const data = await findOneDataHostRelease(releaseId, tx);
    if (areHashEqual(data, release)) {
      return data;
    }

    // Apply changes
    const updated = await updateDataHostRelease(release, tx);
    await addDiffToSyncHostAction(
      {
        dataHostId: release.dataHostId,
        diff: resolveDiff(data, updated),
        syncId,
      },
      tx
    );

    return updated;
  });

/**
 * Delete (mark as unsupported) release for host
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param release - The release
 * @param tx - The db client
 *
 * @returns Promise resolving when release is synced
 */
async function deleteDataHostRelease(
  syncId: string,
  release: DataHostRelease,
  tx: Prisma.TransactionClient
): Promise<void> {
  const updated = await unsupportDataHostRelease(
    {
      dataHostId: release.dataHostId,
      release: release.release as '5' | '5.1',
    },
    tx
  );

  await addDiffToSyncHostAction(
    {
      dataHostId: release.dataHostId,
      diff: resolveDiff(release, updated),
      syncId,
    },
    tx
  );
}

/**
 * Sync releases of a host
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param host - The sync data
 */
export async function syncHostReleases(
  syncId: string,
  host: DataHostSync
): Promise<void> {
  const syncedReleases = new Set<string>();

  // Add new/existing data
  await Promise.all(
    host.availableReleases.map(async (rel) => {
      await upsertHostRelease(syncId, rel);
      await syncHostReports(syncId, rel);
      syncedReleases.add(rel.release);
    })
  );

  // Clean old data
  await dbClient.$transaction(async (tx) => {
    const releases = await findAllDataHostRelease(host.id, {}, tx);

    return Promise.all(
      releases.map(async (rel) => {
        if (rel.supported && !syncedReleases.has(rel.release)) {
          await deleteDataHostRelease(syncId, rel, tx);
        }
      })
    );
  });
}
