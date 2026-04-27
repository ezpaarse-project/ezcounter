import { z } from '@ezcounter/dto';

import { HarvestError, HarvestJob } from './read';

/**
 * Validation for updating a harvest job from DB
 */
export const UpdateHarvestJob = z.object({
  ...HarvestJob.partial().shape,

  id: HarvestJob.shape.id,
});

/**
 * Type for updating a harvest job from DB
 */
export type UpdateHarvestJob = z.infer<typeof UpdateHarvestJob>;

/**
 * Validation for failing a harvest job from DB
 */
export const FailHarvestJob = z.object({
  error: HarvestError,

  id: HarvestJob.shape.id,
});

/**
 * Type for failing a harvest job from DB
 */
export type FailHarvestJob = z.infer<typeof FailHarvestJob>;
