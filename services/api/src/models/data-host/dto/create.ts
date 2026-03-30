import type { z } from '@ezcounter/dto';

import {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from './read';

/**
 * Validation for adding a release supported by Data Host
 */
export const CreateDataHost = DataHost.omit({
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for adding a release supported by Data Host
 */
export type CreateDataHost = z.infer<typeof CreateDataHost>;

/**
 * Validation for adding a release supported by Data Host
 */
export const CreateDataHostSupportedRelease = DataHostSupportedRelease.omit({
  createdAt: true,
  refreshedAt: true,
  updatedAt: true,
});

/**
 * Type for adding a release supported by Data Host
 */
export type CreateDataHostSupportedRelease = z.infer<
  typeof CreateDataHostSupportedRelease
>;

/**
 * Validation for adding a report supported by Data Host
 */
export const CreateDataHostSupportedReport = DataHostSupportedReport.omit({
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for adding a report supported by Data Host
 */
export type CreateDataHostSupportedReport = z.infer<
  typeof CreateDataHostSupportedReport
>;
