import { omit } from 'es-toolkit';

import type { DataHostReport, Prisma } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import type { DiffEntry } from '~/models/diff/dto';
import {
  createDataHostReport,
  doesDataHostReportExists,
  findAllDataHostReport,
  findOneDataHostReport,
  unsupportDataHostReport,
  updateDataHostReport,
} from '~/models/datahost-report/methods';
import { areHashEqual, objectDiff } from '~/models/diff/methods';
import { addDiffToSyncHostAction } from '~/models/sync-activity/methods';

import type { DataHostReleaseSync, DataHostReportSync } from '../dto';

/**
 * Shorthand to resolve diff between 2 version of a report
 *
 * @param rep1 The first report
 * @param rep2 The second report
 *
 * @returns The diff
 */
const resolveDiff = (
  rep1: Record<string, unknown>,
  rep2: Record<string, unknown>
): DiffEntry[] =>
  objectDiff(
    {
      [`availableReleases.${rep1.release}.availableReports.${rep1.reportId}`]:
        omit(rep1, ['createdAt', 'updatedAt', 'changes']),
    },
    {
      [`availableReleases.${rep2.release}.availableReports.${rep2.reportId}`]:
        omit(rep2, ['createdAt', 'updatedAt', 'changes']),
    }
  );

/**
 * Create or update report for host from source data
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param report - The sync data
 *
 * @returns Promise resolving when report is synced
 */
const upsertHostReport = (
  syncId: string,
  report: DataHostReportSync
): Promise<DataHostReport> =>
  dbClient.$transaction(async (tx) => {
    const reportId = {
      dataHostId: report.dataHostId,
      release: report.release,
      reportId: report.reportId,
    };

    // Create if doesn't exists
    const exists = await doesDataHostReportExists(reportId, tx);
    if (!exists) {
      const created = await createDataHostReport(report, tx);
      await addDiffToSyncHostAction(
        {
          dataHostId: report.dataHostId,
          diff: resolveDiff({}, created),
          syncId,
        },
        tx
      );

      return created;
    }

    // Skip if nothing changed
    const data = await findOneDataHostReport(reportId, tx);
    if (areHashEqual(data, report)) {
      return data;
    }

    // Apply changes
    const updated = await updateDataHostReport(report, tx);
    await addDiffToSyncHostAction(
      {
        dataHostId: report.dataHostId,
        diff: resolveDiff(data, updated),
        syncId,
      },
      tx
    );

    return updated;
  });

/**
 * Delete (mark as unsupported) report for host
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param report - The report
 * @param tx - The db client
 *
 * @returns Promise resolving when report is synced
 */
async function deleteDataHostReport(
  syncId: string,
  report: DataHostReport,
  tx: Prisma.TransactionClient
): Promise<void> {
  // TODO: when creating "local" release -> set supported to false and add change
  const updated = await unsupportDataHostReport(
    {
      dataHostId: report.dataHostId,
      release: report.release as '5' | '5.1',
      reportId: report.reportId,
    },
    tx
  );

  await addDiffToSyncHostAction(
    {
      dataHostId: report.dataHostId,
      diff: resolveDiff(report, updated),
      syncId,
    },
    tx
  );
}

/**
 * Sync reports of a host for a given release
 *
 * @param syncId - The ID of the sync (used to log actions)
 * @param release - The sync data
 */
export async function syncHostReports(
  syncId: string,
  release: DataHostReleaseSync
): Promise<void> {
  const syncedReports = new Set<string>();

  // Add new/existing data
  await Promise.all(
    release.availableReports.map(async (report) => {
      await upsertHostReport(syncId, report);
      syncedReports.add(report.reportId);
    })
  );

  // Clean old data
  await dbClient.$transaction(async (tx) => {
    const releases = await findAllDataHostReport(
      {
        dataHostId: release.dataHostId,
        release: release.release,
      },
      {},
      tx
    );

    return Promise.all(
      releases.map(async (rep) => {
        if (!syncedReports.has(rep.reportId)) {
          await deleteDataHostReport(syncId, rep, tx);
        }
      })
    );
  });
}
