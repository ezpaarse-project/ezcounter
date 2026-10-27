import type { z } from '@ezcounter/dto';

import { DataHostReport, DataHostReportChange } from './read';

/**
 * Validation for adding a report supported by Data Host
 */
export const CreateDataHostReport = DataHostReport
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
export type CreateDataHostReport = z.infer<typeof CreateDataHostReport>;

/**
 * Validation for changing a report supported
 */
export const CreateDataHostReportChange = DataHostReportChange
  // Readonly properties
  .omit({
    createdAt: true,
  })
  // Optional properties (have default in db schema)
  .partial({
    id: true,
  });

/**
 * Type for changing a report supported
 */
export type CreateDataHostReportChange = z.infer<
  typeof CreateDataHostReportChange
>;
