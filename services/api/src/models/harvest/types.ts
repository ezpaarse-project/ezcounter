import { z } from '@ezcounter/models/lib/zod';

import {
  HarvestJobData,
  HarvestJobStatusEvent,
} from '@ezcounter/models/queues';
import {
  HarvestAdditionalParams,
  HarvestDownloadOptions,
  HarvestReportOptions,
  HarvestReportPeriod,
} from '@ezcounter/models/harvest';

/**
 * Validation for a harvest request
 */
export const HarvestRequest = z.object({
  ...HarvestJobData.omit({ id: true, try: true }).shape,

  download: z.object({
    ...HarvestDownloadOptions.omit({ report: true }).shape,

    // Allow for multiple reports
    reports: z
      .array(
        z.object({
          ...HarvestReportOptions.shape,

          // Allow to split periods
          splitPeriodBy: z
            .int()
            .min(1)
            .optional()
            .describe(
              'If present, will split period by the number of given months'
            ),
        })
      )
      .min(1)
      .describe('Information about reports to harvest'),
  }),
});

/**
 * Type for a harvest request
 */
export type HarvestRequest = z.infer<typeof HarvestRequest>;

/**
 * Validation for a harvest job from DB
 */
export const HarvestJob = z.object({
  id: HarvestJobStatusEvent.shape.id,

  // Information on job
  reportId: z.string().describe('ID of the report harvested'),

  period: HarvestReportPeriod.describe('Period of the report'),

  periodFormat: z.string().describe('Format of the period'),

  release: z.string().describe('COUNTER release of the report'),

  params: HarvestAdditionalParams.describe('Additional params of the report'),

  paramsSeparator: z.string().describe('Separator for multi-valuated params'),

  baseUrl: z.url().describe('URL to use to harvest'),

  timeout: z.int().min(100).describe('Timeout of the job in ms'),

  forceDownload: z.boolean().describe('Should force download the report'),

  index: z.string().describe('Target Elastic index'),

  // Status of job
  status: HarvestJobStatusEvent.shape.status,

  current: HarvestJobStatusEvent.shape.current,

  error: HarvestJobStatusEvent.shape.error,

  download: HarvestJobStatusEvent.shape.download.unwrap(),

  extract: HarvestJobStatusEvent.shape.extract.unwrap(),
});

/**
 * Type for a harvest job from DB
 *
 * A mix between `HarvestJobData` and `HarvestJobStatusEvent` (but with required properties)
 */
export type HarvestJob = z.infer<typeof HarvestJob>;

export * from '@ezcounter/models/harvest';
