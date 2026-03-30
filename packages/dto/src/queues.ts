import { z } from '.';
import {
  HarvestDownloadOptions,
  HarvestEnrichOptions,
  HarvestError,
  HarvestException,
  HarvestInsertOptions,
} from './harvest';

/**
 * Validation for the data used to dispatch harvest jobs
 */
export const HarvestDispatchData = z.object({
  queueName: z.string().describe('Queue to find harvest jobs'),
});

/**
 * Type for the data used to dispatch harvest jobs
 */
export type HarvestDispatchData = z.infer<typeof HarvestDispatchData>;

/**
 * Validation for the data used to harvest a COUNTER report
 */
export const HarvestJobData = z.object({
  download: HarvestDownloadOptions.describe(
    'Information about how to download report'
  ),

  enrich: HarvestEnrichOptions.optional().describe(
    'Information about enrich that needs to be done'
  ),

  id: z.string().describe('Job ID'),

  insert: HarvestInsertOptions.describe(
    'Information on how to deal with harvested data'
  ),

  try: z.int().optional().describe('Job try count'),
});

/**
 * Type for the data used to harvest a COUNTER report
 */
export type HarvestJobData = z.infer<typeof HarvestJobData>;

/**
 * Validation for the event about the harvest of a COUNTER report
 */
export const HarvestJobStatusEvent = z.object({
  current: z
    .enum(['download', 'extract'])
    .optional()
    .describe('Current step being processed'),

  download: z
    .object({
      done: z.boolean().describe('Is step done'),

      httpCode: z.number().optional(),

      progress: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe('Progress of download'),

      source: z
        .enum(['remote', 'archive'])
        .optional()
        .describe('Source of the report'),

      url: z.string().optional().describe('URL of the remote, or to the file'),
    })
    .optional()
    .describe('Information about download step'),

  error: HarvestError.optional().describe(
    'The error that occurred while harvesting'
  ),

  extract: z
    .object({
      done: z.boolean().describe('Is step done'),

      exceptions: z
        .array(HarvestException)
        .optional()
        .describe('Exceptions found in report'),

      header: z.boolean().optional().describe('Is the header valid'),

      items: z.int().optional().describe('Number of items found'),

      registryId: z
        .string()
        .or(z.null())
        .optional()
        .describe('Registry ID extracted from header, null if not found'),
    })
    .optional()
    .describe('Information about extract step'),

  id: z.string().describe('Job ID'),

  startedAt: z.coerce
    .date()
    .optional()
    .describe('When job started to be processed'),

  status: z
    .enum(['pending', 'delayed', 'processing', 'error', 'done'])
    .describe('Current status of job'),
});

/**
 * Type for the event about the harvest of a COUNTER report
 *
 * Will **PATCH** previous data using the same id
 */
export type HarvestJobStatusEvent = z.infer<typeof HarvestJobStatusEvent>;
