import type { Prisma } from '@ezcounter/database';

import { applyDiff } from '~/models/diff/methods';

import { DataHostRelease, DataHostReleaseDiffEntry } from '../dto/read';

/**
 * Helper to apply changes on a release
 *
 * @param release The release with changes
 *
 * @returns The release with list of id applied
 */
export function applyDataHostReleaseChanges(
  release: Prisma.DataHostReleaseGetPayload<{ include: { changes: true } }>
): DataHostRelease {
  let target = DataHostRelease.parse({
    ...release,
    _appliedChanges: [],
    changes: undefined,
  });

  const appliedChanges: string[] = [];

  for (const current of release.changes) {
    const diff = current.diff.filter((entry) =>
      DataHostReleaseDiffEntry.validate(entry)
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
