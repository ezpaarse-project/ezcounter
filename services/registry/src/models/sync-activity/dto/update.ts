import type { z } from '@ezcounter/dto';

import { SyncActivity } from './read';

/**
 * Validation for updating a registry sync activity
 */
export const UpdateSyncActivity = SyncActivity
  // Readonly properties
  .omit({
    createdAt: true,
    sourceUrl: true,
    updatedAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    error: true,
    startedAt: true,
    took: true,
  });

/**
 * Type for updating a registry sync activity
 */
export type UpdateSyncActivity = z.infer<typeof UpdateSyncActivity>;
