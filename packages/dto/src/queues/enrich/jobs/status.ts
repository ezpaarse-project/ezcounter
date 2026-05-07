import { z } from '../../..';
import { HarvestError, HarvestReportPeriodDate } from '../../../harvest';

const EnrichSourceStatusEvent = z
  .object({
    items: z.int().min(0).describe('Number of items from report processed'),

    miss: z
      .int()
      .min(0)
      .describe('Number of items from report that is missing from source'),

    progress: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe(
        'Progress of enrich, calculated using extract step and items processed'
      ),
    remote: z.int().min(0).describe('Number of items retrieved from remote'),

    store: z.int().min(0).describe('Number of items retrieved from store'),
  })
  .optional()
  .describe('Information about enrich done with ezUnpaywall');

/**
 * Validation for the event about the enrich of a COUNTER report
 */
export const EnrichJobStatusEvent = z.object({
  enrich: z
    .object({
      progress: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe(
          'Progress of enrich, calculated using items processed of sources'
        ),

      sources: z
        .record(z.string(), EnrichSourceStatusEvent)
        .optional()
        .describe('Information about sources used to enrich'),

      status: z
        .enum(['pending', 'processing', 'done', 'skipped'])
        .describe('Current status of step'),
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
        .describe('Months found in items'),

      created: z
        .int()
        .min(0)
        .optional()
        .describe('Number of documents created'),

      items: z
        .int()
        .min(0)
        .optional()
        .describe('Number of items from report processed'),

      progress: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe(
          'Progress of insert, calculated using extract step and items processed'
        ),

      status: z
        .enum(['pending', 'processing', 'done'])
        .describe('Current status of step'),

      updated: z
        .int()
        .min(0)
        .optional()
        .describe('Number of documents updated'),
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
