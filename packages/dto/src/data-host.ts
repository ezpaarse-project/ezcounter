import { z } from '.';
import {
  HarvestDataHostOptions,
  HarvestException,
  HarvestReportOptions,
  HarvestReportPeriod,
} from './harvest';

/**
 * Validation for the options to check credentials
 */
export const DataHostAuthCheckOptions = z.object({
  dataHost: HarvestDataHostOptions.describe(
    'Information on how to harvest the report'
  ),

  release: z.literal(['5', '5.1']).describe('COUNTER release to use'),

  report: z.object({
    id: z
      .string()
      .toLowerCase()
      .describe('Report ID to use for checking credentials'),

    params: HarvestReportOptions.shape.params,

    period: HarvestReportPeriod.optional().describe(
      'Period to use for checking credentials'
    ),
  }),
});

/**
 * Type for the options to check credentials
 */
export type DataHostAuthCheckOptions = z.infer<typeof DataHostAuthCheckOptions>;

/**
 * Validation for the result of a credentials check
 */
export const DataHostAuthCheckResult = z.object({
  errors: z
    .array(HarvestException)
    .describe('List of errors if credentials are invalid'),

  success: z.boolean().describe('Whether credentials are valid'),
});

/**
 * Type for the result of a credentials check
 */
export type DataHostAuthCheckResult = z.infer<typeof DataHostAuthCheckResult>;
