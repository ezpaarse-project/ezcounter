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
  createdAt: z.coerce.date().describe('Creation date'),

  id: z.string().describe('ID of the Data Host'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host'
  ),

  paramsSeparator: HarvestDataHostOptions.shape.paramsSeparator.unwrap(),

  periodFormat: HarvestDataHostOptions.shape.periodFormat.unwrap(),

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

  refreshedAt: z.coerce.date().nullable().describe('Last report refresh date'),

  release: HarvestReportOptions.shape.release,

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
    .describe('First month available in report - empty if no date'),

  firstMonthAvailableOverride: z
    .string()
    .nullable()
    .describe('Override of the `firstMonthAvailable` property'),

  id: HarvestReportOptions.shape.id,

  lastMonthAvailable: z
    .string()
    .describe('Last month available in report - empty if no date'),

  lastMonthAvailableOverride: z
    .string()
    .nullable()
    .describe('Override of the `lastMonthAvailable` property'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using report'
  ),

  release: DataHostSupportedRelease.shape.release,

  supported: z.boolean().describe('Is report supported by data host'),

  supportedOverride: z
    .boolean()
    .nullable()
    .describe('Override of the `supported` property'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a report supported by Data Host
 */
export type DataHostSupportedReport = z.infer<typeof DataHostSupportedReport>;
