import type { z } from '@ezcounter/dto';

import { SyncActivity, SyncHostAction } from './read';

/**
 * Validation for creating a registry sync activity
 */
export const CreateSyncActivity = SyncActivity
  // Readonly properties
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    error: true,
    id: true,
    startedAt: true,
    took: true,
  });

/**
 * Type for creating a registry sync activity
 */
export type CreateSyncActivity = z.infer<typeof CreateSyncActivity>;

/**
 * Validation for creating a action made on a host by a sync
 */
export const CreateSyncHostAction = SyncHostAction
  // Readonly properties
  .omit({
    createdAt: true,
    dataHost: true,
  });

/**
 * Type for creating a action made on a host by a sync
 */
export type CreateSyncHostAction = z.infer<typeof CreateSyncHostAction>;
