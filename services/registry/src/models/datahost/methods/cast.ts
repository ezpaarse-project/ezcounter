import type { Prisma } from '@ezcounter/database';

import { applyDiff } from '~/models/diff/methods';

import { DataHost, DataHostDiffEntry } from '../dto/read';

/**
 * Helper to apply changes on a host
 *
 * @param host The host with changes
 *
 * @returns The host with list of id applied
 */
export function applyDataHostChanges(
  host: Prisma.DataHostGetPayload<{ include: { changes: true } }>
): DataHost {
  let target = DataHost.parse({
    ...host,
    _appliedChanges: [],
    changes: undefined,
  });

  const appliedChanges: string[] = [];

  for (const current of host.changes) {
    const diff = current.diff.filter((entry) =>
      DataHostDiffEntry.validate(entry)
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
