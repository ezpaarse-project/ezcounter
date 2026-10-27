import type { z } from '@ezcounter/dto';

import { DataHost, DataHostChange } from './read';

/**
 * Validation for adding a Data Host
 */
export const CreateDataHost = DataHost
  // Readonly properties
  .omit({
    _appliedChanges: true,
    createdAt: true,
    updatedAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    id: true,
    local: true,
    params: true,
  });

/**
 * Type for adding a Data Host
 */
export type CreateDataHost = z.infer<typeof CreateDataHost>;

/**
 * Validation for changing a Data Host
 */
export const CreateDataHostChange = DataHostChange
  // Readonly properties
  .omit({
    createdAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    id: true,
  });

/**
 * Type for changing a Data Host
 */
export type CreateDataHostChange = z.infer<typeof CreateDataHostChange>;
