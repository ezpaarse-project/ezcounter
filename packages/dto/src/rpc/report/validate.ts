import { z } from '../..';

/**
 * Validation for the data following a report validation request
 */
export const ReportValidationResponse = z.object({
  host: z.string().describe('Host to push report data'),

  port: z.int().min(0).describe('Port to push report data'),
});

/**
 * Type for the data following a report validation request
 */
export type ReportValidationResponse = z.infer<typeof ReportValidationResponse>;
