import type { z } from '@ezcounter/dto';

import {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from './read';

/**
 * Validation for adding a release supported by Data Host
 */
export const UpdateDataHost = DataHost.omit({
  // DB id
  id: true,
  // DB readonly
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for adding a release supported by Data Host
 */
export type UpdateDataHost = z.infer<typeof UpdateDataHost>;

/**
 * Validation for adding a release supported by Data Host
 */
export const UpdateDataHostSupportedRelease = DataHostSupportedRelease.omit({
  // DB id
  dataHostId: true,
  release: true,
  // DB readonly
  createdAt: true,
  updatedAt: true,
  refreshedAt: true,
});

/**
 * Type for adding a release supported by Data Host
 */
export type UpdateDataHostSupportedRelease = z.infer<
  typeof UpdateDataHostSupportedRelease
>;

/**
 * Validation for adding a report supported by Data Host
 */
export const UpdateDataHostSupportedReport = DataHostSupportedReport.omit({
  // DB id
  dataHostId: true,
  release: true,
  id: true,
  // Data form host
  supported: true,
  firstMonthAvailable: true,
  lastMonthAvailable: true,
  // DB readonly
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for adding a report supported by Data Host
 */
export type UpdateDataHostSupportedReport = z.infer<
  typeof UpdateDataHostSupportedReport
>;
