import type { HarvestError } from '@ezcounter/dto/harvest';
import type { EnrichJobData } from '@ezcounter/dto/queues';
import { asHarvestError } from '@ezcounter/toolbox/harvest';

import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { enrichReportItem } from './steps/enrich';
import { insertReportItem } from './steps/insert';

/**
 * Mark harvest job as processing
 *
 * @param job - The job
 */
function markJobAsProcessing(job: EnrichJobData): void {
  void sendEnrichJobStatusEvent({
    id: job.id,
    status: 'processing',
  });
}

/**
 * Mark harvest job as error
 *
 * @param job - The job
 * @param error - The error
 */
function markJobAsError(job: EnrichJobData, error: HarvestError): void {
  void sendEnrichJobStatusEvent({
    error,
    id: job.id,
    status: 'error',
  });
}

/**
 * Enrich and insert a report item
 *
 * @param job - The options to enrich and insert a report item
 */
export async function insertEnrichedReportItem(
  job: EnrichJobData
): Promise<void> {
  markJobAsProcessing(job);

  try {
    const enrichData = await enrichReportItem(job);
    await insertReportItem(enrichData, job);
  } catch (error) {
    markJobAsError(job, asHarvestError(error));
    throw error;
  }
}
