import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestDataHostOptions,
  HarvestDownloadOptions,
  HarvestReportOptions,
} from '@ezcounter/dto/harvest';

/**
 * Validation for a registered Data Host
 */
export const DataHost = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  id: z.string().describe('ID of the Data Host'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host'
  ),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a registered Data Host
 */
export type DataHost = z.infer<typeof DataHost>;

/**
 * Validation for a release supported by Data Host
 */
export const DataHostSupportedRelease = z.object({
  baseUrl: HarvestDataHostOptions.shape.baseUrl,

  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: DataHost.shape.id,

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using release'
  ),

  paramsSeparator: HarvestDataHostOptions.shape.paramsSeparator.unwrap(),

  periodFormat: HarvestDataHostOptions.shape.periodFormat.unwrap(),

  release: HarvestDownloadOptions.shape.release,

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a release supported by Data Host
 */
export type DataHostSupportedRelease = z.infer<typeof DataHostSupportedRelease>;

/**
 * Validation for a report supported by Data Host
 */
export const DataHostSupportedReport = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: DataHost.shape.id,

  firstMonthAvailable: z
    .string()
    .nullable()
    .describe(
      'First month available in report - empty if no date - null to not override'
    ),

  id: HarvestReportOptions.shape.id,

  lastMonthAvailable: z
    .string()
    .nullable()
    .describe(
      'Last month available in report - empty if no date - null to not override'
    ),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using report'
  ),

  release: DataHostSupportedRelease.shape.release,

  supported: z
    .boolean()
    .nullable()
    .describe('Is report supported by data - null to not override'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a report supported by Data Host
 */
export type DataHostSupportedReport = z.infer<typeof DataHostSupportedReport>;
