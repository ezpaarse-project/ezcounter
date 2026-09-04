import { HarvestJobStatus } from '@ezcounter/database';
import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestHooks,
  HarvestReportPeriod,
} from '@ezcounter/dto/harvest';
import {
  EnrichJobStatusEvent,
  HarvestJobStatusEvent,
} from '@ezcounter/dto/queues';

const MIN_TIMEOUT = 100;

export * from '@ezcounter/dto/harvest';

/**
 * Validation for filtering harvest jobs
 */
export const HarvestJobFilters = z
  .object({
    'createdAt[gte]': z.coerce.date().describe('Filter harvests queued after'),
    'createdAt[lte]': z.coerce.date().describe('Filter harvests queued before'),

    dataHostId: z.string().describe('Filter harvests by ID of the data host'),

    release: z.string().describe('Filter harvests by COUNTER release'),

    requestId: z.string().describe('Filter harvests by request ID'),

    'startedAt[gte]': z.coerce.date().describe('Filter harvests started after'),
    'startedAt[lte]': z.coerce
      .date()
      .describe('Filter harvests started before'),

    status: z.enum(HarvestJobStatus).describe('Filter harvests by status'),

    'updatedAt[gte]': z.coerce.date().describe('Filter harvests updated after'),
    'updatedAt[lte]': z.coerce
      .date()
      .describe('Filter harvests updated before'),
  })
  .partial();

/**
 * Type for filtering harvest jobs
 */
export type HarvestJobFilters = z.infer<typeof HarvestJobFilters>;

/**
 * Validation for a harvest job from DB
 */
export const HarvestJob = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: z.string().describe('ID of the data host'),

  download: HarvestJobStatusEvent.shape.download.unwrap(),

  enrich: EnrichJobStatusEvent.shape.enrich.unwrap(),

  enrichSources: z.array(z.string()).describe('Sources to use with enrich'),

  error: HarvestJobStatusEvent.shape.error.nullish(),

  extract: HarvestJobStatusEvent.shape.extract.unwrap(),

  forceDownload: z.boolean().describe('Should force download the report'),

  hooks: HarvestHooks.describe('Hooks of job'),

  id: HarvestJobStatusEvent.shape.id,

  index: z.string().describe('Target Elastic index'),

  insert: EnrichJobStatusEvent.shape.insert.unwrap(),

  params: HarvestAdditionalParams.describe('Additional params of the report'),

  period: HarvestReportPeriod.describe('Period of the report'),

  release: z.string().describe('COUNTER release of the report'),

  reportId: z.string().describe('ID of the report harvested'),

  requestId: z.string().describe('ID of request that created the job'),

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
