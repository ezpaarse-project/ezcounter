import type { z } from '@ezcounter/dto';

import { DataHostRelease } from './read';

/**
 * Validation for updating a release supported by Data Host
 */
export const UpdateDataHostRelease = DataHostRelease
  // Readonly properties
  .omit({
    _appliedChanges: true,
    createdAt: true,
    updatedAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    availableSince: true,
    compliant: true,
    params: true,
    paramsSeparator: true,
    periodFormat: true,
    requiredAuth: true,
    supported: true,
  });

/**
 * Type for updating a release supported by Data Host
 */
export type UpdateDataHostRelease = z.infer<typeof UpdateDataHostRelease>;
