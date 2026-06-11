import { z } from '.';

/**
 * Validation for the data used to validate report
 */
export const ReportValidationOptions = z.object({
  release: z.literal(['5', '5.1']).describe('COUNTER release to expect'),

  reportId: z.string().toLowerCase().describe('Report ID to harvest'),
});

/**
 * Type for the data used to validate report
 */
export type ReportValidationOptions = z.infer<typeof ReportValidationOptions>;

/**
 * Validation for the data for error occurred in a validation
 */
export const ReportValidationResultError = z.looseObject({
  message: z.string(),
});

/**
 * Type for the data for error occurred in a validation
 */
export type ReportValidationResultError = z.infer<
  typeof ReportValidationResultError
>;

/**
 * Validation for the data for the part of a report validation
 */
export const ReportValidationResultPart = z.object({
  errors: z.array(ReportValidationResultError),

  valid: z.boolean(),
});

/**
 * Type for the data for the part of a report validation
 */
export type ReportValidationResultPart = z.infer<
  typeof ReportValidationResultPart
>;

/**
 * Validation for the data for the result of a report validation
 */
export const ReportValidationResult = z.object({
  header: ReportValidationResultPart,

  items: ReportValidationResultPart,
});

/**
 * Type for the data for the result of a report validation request
 */
export type ReportValidationResult = z.infer<typeof ReportValidationResult>;
