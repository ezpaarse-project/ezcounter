import {
  HarvestDataHostOptions,
  HarvestReportOptions,
} from '@ezcounter/models/harvest';
import { z } from '@ezcounter/models/lib/zod';

/**
 * Validation for a registered Data Host
 */
export const DataHost = z.object({
  id: z.string().describe('ID of the Data Host'),

  periodFormat: HarvestDataHostOptions.shape.periodFormat.unwrap(),

  paramsSeparator: HarvestDataHostOptions.shape.paramsSeparator.unwrap(),

  params: HarvestDataHostOptions.shape.additionalParams.unwrap(),

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a registered Data Host
 */
export type DataHost = z.infer<typeof DataHost>;

/**
 * Validation for adding a release supported by Data Host
 */
export const InputDataHost = DataHost.omit({
  // DB id
  id: true,
  // DB readonly
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for adding a release supported by Data Host
 */
export type InputDataHost = z.infer<typeof InputDataHost>;

/**
 * Validation for a release supported by Data Host
 */
export const DataHostSupportedRelease = z.object({
  dataHostId: DataHost.shape.id,

  release: HarvestReportOptions.shape.release,

  baseUrl: HarvestDataHostOptions.shape.baseUrl,

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a release supported by Data Host
 */
export type DataHostSupportedRelease = z.infer<typeof DataHostSupportedRelease>;

/**
 * Validation for adding a release supported by Data Host
 */
export const InputDataHostSupportedRelease = DataHostSupportedRelease.omit({
  // DB id
  dataHostId: true,
  release: true,
  // DB readonly
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for adding a release supported by Data Host
 */
export type InputDataHostSupportedRelease = z.infer<
  typeof InputDataHostSupportedRelease
>;

/**
 * Validation for a report supported by Data Host
 */
export const DataHostSupportedReport = z.object({
  dataHostId: DataHost.shape.id,

  release: DataHostSupportedRelease.shape.release,

  id: HarvestReportOptions.shape.id,

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

/**
 * Validation for adding a report supported by Data Host
 */
export const InputDataHostSupportedReport = DataHostSupportedReport.omit({
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
export type InputDataHostSupportedReport = z.infer<
  typeof InputDataHostSupportedReport
>;

/**
 * Type for a data host including supported data
 */
export type DataHostWithSupportedData = DataHost & {
  supportedReleases: (DataHostSupportedRelease & {
    supportedReports: DataHostSupportedReport[];
  })[];
};
