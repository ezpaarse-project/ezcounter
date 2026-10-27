import type { z } from '@ezcounter/dto';

import { DataHost } from './read';

/**
 * Validation for updating a Data Host
 */
export const UpdateDataHost = DataHost
  // Readonly properties
  .omit({
    _appliedChanges: true,
    createdAt: true,
    updatedAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    local: true,
    params: true,
  });

/**
 * Type for updating a Data Host
 */
export type UpdateDataHost = z.infer<typeof UpdateDataHost>;
