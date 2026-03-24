import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestReportPeriod,
} from '@ezcounter/dto/harvest';
import { HarvestJobStatusEvent } from '@ezcounter/dto/queues';

export * from '@ezcounter/dto/harvest';

/**
 * Validation for a harvest job from DB
 */
export const HarvestJob = z.object({
  id: HarvestJobStatusEvent.shape.id,

  // Information on job
  reportId: z.string().describe('ID of the report harvested'),

  period: HarvestReportPeriod.describe('Period of the report'),

  release: z.string().describe('COUNTER release of the report'),

  params: HarvestAdditionalParams.describe('Additional params of the report'),

  dataHostId: z.string().describe('ID of the data host'),

  timeout: z.int().min(100).describe('Timeout of the job in ms'),

  forceDownload: z.boolean().describe('Should force download the report'),

  index: z.string().describe('Target Elastic index'),

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),

  // Status of job
  status: HarvestJobStatusEvent.shape.status,

  current: HarvestJobStatusEvent.shape.current.nullish(),

  error: HarvestJobStatusEvent.shape.error.nullish(),

  download: HarvestJobStatusEvent.shape.download.unwrap(),

  extract: HarvestJobStatusEvent.shape.extract.unwrap(),

  startedAt: HarvestJobStatusEvent.shape.startedAt.nullish(),

  took: z.int().min(0).nullable().describe('Time that harvesting took'),
});

/**
 * Type for a harvest job from DB
 *
 * A mix between `HarvestJobData` and `HarvestJobStatusEvent` (but with required properties)
 */
export type HarvestJob = z.infer<typeof HarvestJob>;
