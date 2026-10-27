import type { z } from '@ezcounter/dto';

import { DataHostRelease, DataHostReleaseChange } from './read';

/**
 * Validation for adding a release supported by Data Host
 */
export const CreateDataHostRelease = DataHostRelease
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
 * Type for adding a release supported by Data Host
 */
export type CreateDataHostRelease = z.infer<typeof CreateDataHostRelease>;

/**
 * Validation for changing a release supported
 */
export const CreateDataHostReleaseChange = DataHostReleaseChange
  // Readonly properties
  .omit({
    createdAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    id: true,
  });

/**
 * Type for changing a release supported
 */
export type CreateDataHostReleaseChange = z.infer<
  typeof CreateDataHostReleaseChange
>;
