import { HarvestJobStatus, HarvestJobStep } from '@ezcounter/database';
import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestReportPeriod,
} from '@ezcounter/dto/harvest';
import {
  EnrichJobStatusEvent,
  HarvestJobStatusEvent,
} from '@ezcounter/dto/queues';

const MIN_TIMEOUT = 100;

export * from '@ezcounter/dto/harvest';

/**
 * Validation for a harvest job from DB
 */
export const HarvestJob = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  current: z
    .enum(HarvestJobStep)
    .nullish()
    .describe('Current step being processed'),

  dataHostId: z.string().describe('ID of the data host'),

  download: HarvestJobStatusEvent.shape.download.unwrap(),

  enrich: EnrichJobStatusEvent.shape.enrich.unwrap(),

  error: HarvestJobStatusEvent.shape.error.nullish(),

  extract: HarvestJobStatusEvent.shape.extract.unwrap(),

  forceDownload: z.boolean().describe('Should force download the report'),

  id: HarvestJobStatusEvent.shape.id,

  index: z.string().describe('Target Elastic index'),

  insert: EnrichJobStatusEvent.shape.insert.unwrap(),

  params: HarvestAdditionalParams.describe('Additional params of the report'),

  period: HarvestReportPeriod.describe('Period of the report'),

  release: z.string().describe('COUNTER release of the report'),

  reportId: z.string().describe('ID of the report harvested'),

  startedAt: HarvestJobStatusEvent.shape.startedAt.nullish(),

  status: z.enum(HarvestJobStatus).describe('Current status of job'),

  timeout: z.int().min(MIN_TIMEOUT).describe('Timeout of the job in ms'),

  took: z.int().min(0).nullable().describe('Time that harvesting took'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a harvest job from DB
 *
 * A mix between `HarvestJobData` and `HarvestJobStatusEvent` (but with required properties)
 */
export type HarvestJob = z.infer<typeof HarvestJob>;
