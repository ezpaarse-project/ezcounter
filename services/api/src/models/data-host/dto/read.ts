import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestDataHostOptions,
  HarvestReportOptions,
} from '@ezcounter/dto/harvest';

/**
 * Validation for a registered Data Host
 */
export const DataHost = z.object({
  id: z.string().describe('ID of the Data Host'),

  periodFormat: HarvestDataHostOptions.shape.periodFormat.unwrap(),

  paramsSeparator: HarvestDataHostOptions.shape.paramsSeparator.unwrap(),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host'
  ),

  createdAt: z.coerce.date().describe('Creation date'),

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
  dataHostId: DataHost.shape.id,

  release: HarvestReportOptions.shape.release,

  baseUrl: HarvestDataHostOptions.shape.baseUrl,

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using release'
  ),

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),

  refreshedAt: z.coerce.date().nullable().describe('Last report refresh date'),
});

/**
 * Type for a release supported by Data Host
 */
export type DataHostSupportedRelease = z.infer<typeof DataHostSupportedRelease>;

/**
 * Validation for a report supported by Data Host
 */
export const DataHostSupportedReport = z.object({
  dataHostId: DataHost.shape.id,

  release: DataHostSupportedRelease.shape.release,

  id: HarvestReportOptions.shape.id,

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using report'
  ),

  supported: z.boolean().describe('Is report supported by data host'),

  supportedOverride: z
    .boolean()
    .nullable()
    .describe('Override of the `supported` property'),

  firstMonthAvailable: z
    .string()
    .describe('First month available in report - empty if no date'),

  firstMonthAvailableOverride: z
    .string()
    .nullable()
    .describe('Override of the `firstMonthAvailable` property'),

  lastMonthAvailable: z
    .string()
    .describe('Last month available in report - empty if no date'),

  lastMonthAvailableOverride: z
    .string()
    .nullable()
    .describe('Override of the `lastMonthAvailable` property'),

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a report supported by Data Host
 */
export type DataHostSupportedReport = z.infer<typeof DataHostSupportedReport>;
