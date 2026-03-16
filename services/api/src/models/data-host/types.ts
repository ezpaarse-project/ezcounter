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
 * Validation for a COUNTER release supported by Data Host
 */
export const DataHostSupportedRelease = z.object({
  dataHostId: DataHost.shape.id,

  release: HarvestReportOptions.shape.release,

  baseUrl: HarvestDataHostOptions.shape.baseUrl,

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for  a COUNTER release supported by Data Host
 */
export type DataHostSupportedRelease = z.infer<typeof DataHostSupportedRelease>;

/**
 * Validation for a COUNTER report supported by Data Host
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
 * Type for a COUNTER report supported by Data Host
 */
export type DataHostSupportedReport = z.infer<typeof DataHostSupportedReport>;

export type DataHostSupportedDataRelease = {
  data: DataHostSupportedRelease;
  reports: Map<string, { data: DataHostSupportedReport }>;
};

export type DataHostWithSupportedData = DataHost & {
  supportedReleases: (DataHostSupportedRelease & {
    supportedReports: DataHostSupportedReport[];
  })[];
};
