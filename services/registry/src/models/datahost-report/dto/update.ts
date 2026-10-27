import type { z } from '@ezcounter/dto';

import { DataHostReport } from './read';

/**
 * Validation for adding a report supported by Data Host
 */
export const UpdateDataHostReport = DataHostReport
  // Readonly properties
  .omit({
    _appliedChanges: true,
    createdAt: true,
    updatedAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    params: true,
  });

/**
 * Type for adding a report supported by Data Host
 */
export type UpdateDataHostReport = z.infer<typeof UpdateDataHostReport>;
