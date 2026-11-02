import { z } from '@ezcounter/dto';

import {
  CreateDataHostRelease,
  UpdateDataHostRelease,
} from '~/models/datahost-release/dto';
import {
  CreateDataHostReport,
  UpdateDataHostReport,
} from '~/models/datahost-report/dto';
import { CreateDataHost, UpdateDataHost } from '~/models/datahost/dto';

/**
 * Validation for data needed to sync report from host
 */
export const DataHostReportSync = z.intersection(
  CreateDataHostReport,
  UpdateDataHostReport
);

/**
 * Type for data needed to sync host
 */
export type DataHostReportSync = z.infer<typeof DataHostReportSync>;

/**
 * Validation for data needed to sync release from host
 */
export const DataHostReleaseSync = z
  .intersection(CreateDataHostRelease, UpdateDataHostRelease)
  .and(
    z.object({
      availableReports: z.array(DataHostReportSync),
    })
  );

/**
 * Type for data needed to sync host
 */
export type DataHostReleaseSync = z.infer<typeof DataHostReleaseSync>;

/**
 * Validation for data needed to sync host
 */
export const DataHostSync = z.intersection(CreateDataHost, UpdateDataHost).and(
  z.object({
    availableReleases: z.array(DataHostReleaseSync),
  })
);

/**
 * Type for data needed to sync host
 */
export type DataHostSync = z.infer<typeof DataHostSync>;
