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
  createdAt: true,
  id: true,
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
  createdAt: true,
  dataHostId: true,
  refreshedAt: true,
  release: true,
  updatedAt: true,
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
  createdAt: true,
  dataHostId: true,
  firstMonthAvailable: true,
  id: true,
  lastMonthAvailable: true,
  release: true,
  supported: true,
  updatedAt: true,
});

/**
 * Type for adding a report supported by Data Host
 */
export type UpdateDataHostSupportedReport = z.infer<
  typeof UpdateDataHostSupportedReport
>;
