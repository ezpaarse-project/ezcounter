import { z } from '@ezcounter/dto';

import { DataHost } from '~/models/datahost/dto';
import { DiffEntry } from '~/models/diff/dto';

/**
 * Validation for an error occurred while syncing
 */
export const SyncError = z.object({
  cause: z.json().optional(),
  code: z.string(),
  message: z.string(),
});

/**
 * Type  for an error occurred while syncing
 */
export type SyncError = z.infer<typeof SyncError>;

/**
 * Validation for a registry sync activity
 */
export const SyncActivity = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  error: SyncError.nullable().describe('Error occurred while syncing'),

  id: z.string().describe('ID of the sync'),

  sourceUrl: z.string().describe('The URL used to sync'),

  startedAt: z.coerce.date().nullable().describe('When the sync was started'),

  status: z
    .enum(['pending', 'processing', 'error', 'done'])
    .describe('Status of the sync'),

  took: z.int().min(0).describe('Time sync took'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a registry sync activity
 */
export type SyncActivity = z.infer<typeof SyncActivity>;

/**
 * Validation for an action made on a host by a sync
 */
export const SyncHostAction = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHost: DataHost.describe('Data Host affected'),

  dataHostId: z.string().describe('ID of the host'),

  diff: z.array(DiffEntry).min(1).describe('Modifications applied'),

  syncId: z.string().describe('ID of the sync'),

  type: z
    .enum(['created', 'updated', 'unlinked'])
    .describe('Type of action done'),
});

/**
 * Type for an action made on a host by a sync
 */
export type SyncHostAction = z.infer<typeof SyncHostAction>;

/**
 * Validation for a registry sync activity including actions
 */
export const SyncActivityWithActions = z.object({
  ...SyncActivity.shape,

  hostActions: z
    .array(SyncActivity)
    .describe('Actions done by sync on data hosts'),
});

/**
 * Type for a registry sync activity including actions
 */
export type SyncActivityWithActions = z.infer<typeof SyncActivityWithActions>;
