import type { Prisma } from '@ezcounter/database';

import { applyDiff } from '~/models/diff/methods';

import { DataHostReport, DataHostReportDiffEntry } from '../dto/read';

/**
 * Helper to apply changes on a report
 *
 * @param report The report
 * @param report.changes The changes to apply
 *
 * @returns The report with list of id applied
 */
export function applyDataHostReportChanges(
  report: Prisma.DataHostReportGetPayload<{
    include: { changes: true };
  }>
): DataHostReport {
  let target = DataHostReport.parse({
    ...report,
    _appliedChanges: [],
    changes: undefined,
  });

  const appliedChanges: string[] = [];

  for (const current of report.changes) {
    const diff = current.diff.filter((entry) =>
      DataHostReportDiffEntry.validate(entry)
    );

    if (diff.length > 0) {
      target = applyDiff(target, diff);

      appliedChanges.push(current.id);
    }
  }

  // oxlint-disable-next-line no-underscore-dangle
  target._appliedChanges = appliedChanges;
  return target;
}
