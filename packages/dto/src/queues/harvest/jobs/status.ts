import { z } from '../../..';
import { HarvestError, HarvestException } from '../../../harvest';

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

      httpCode: z.number().optional().describe('HTTP code of download'),

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
    .enum(['pending', 'delayed', 'processing', 'error'])
    .describe('Current status of job'),
});

/**
 * Type for the event about the harvest of a COUNTER report
 *
 * Will **PATCH** previous data using the same id
 */
export type HarvestJobStatusEvent = z.infer<typeof HarvestJobStatusEvent>;
