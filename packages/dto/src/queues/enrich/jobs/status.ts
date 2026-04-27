import { z } from '../../..';
import { HarvestError, HarvestReportPeriodDate } from '../../../harvest';

/**
 * Validation for the event about the enrich of a COUNTER report
 */
export const EnrichJobStatusEvent = z.object({
  current: z
    .enum(['enrich', 'insert'])
    .optional()
    .describe('Current step being processed'),

  enrich: z
    .object({
      done: z.boolean().describe('Is step done'),
    })
    .optional()
    .describe('Information about enrich step'),

  error: HarvestError.optional().describe(
    'The error that occurred while enriching'
  ),

  id: z.string().describe('Job ID'),

  insert: z
    .object({
      coveredMonths: z
        .array(HarvestReportPeriodDate)
        .optional()
        .describe('Months found in report'),

      done: z.boolean().describe('Is step done'),

      insertedItems: z
        .int()
        .min(0)
        .optional()
        .describe('Number of items inserted'),

      updatedItems: z
        .int()
        .min(0)
        .optional()
        .describe('Number of items updated'),
    })
    .optional()
    .describe('Information about insert step'),

  status: z
    .enum(['processing', 'error', 'done'])
    .describe('Current status of job'),
});

/**
 * Type for the event about the enrich of a COUNTER report
 *
 * Will **PATCH** previous data using the same id
 */
export type EnrichJobStatusEvent = z.infer<typeof EnrichJobStatusEvent>;
