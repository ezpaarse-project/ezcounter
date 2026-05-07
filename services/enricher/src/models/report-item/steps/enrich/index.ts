import type { z } from '@ezcounter/dto';
import type { EnrichSource } from '@ezcounter/dto/enrich';
import type { HarvestError } from '@ezcounter/dto/harvest';
import type { EnrichJobData } from '@ezcounter/dto/queues';
import { asHarvestError } from '@ezcounter/toolbox/harvest';

import { queueEnrichJob } from '~/queues/enrich/jobs/pub';
import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { enrichItemUsingEzUnpaywall, enrichItemUsingOpenAlex } from './sources';

type EnrichResult = Record<string, z.core.util.JSONType>;

/**
 * Mark harvest job as processing
 *
 * @param job - The job
 *
 * @returns A promise that resolves when the event is sent
 */
const markJobAsProcessing = (job: EnrichJobData): Promise<void> =>
  sendEnrichJobStatusEvent({
    id: job.id,
    status: 'processing',
  });

/**
 * Mark harvest job as error
 *
 * @param job - The job
 * @param error - The error
 *
 * @returns A promise that resolves when the event is sent
 */
const markJobAsError = (
  job: EnrichJobData,
  error: HarvestError
): Promise<void> =>
  sendEnrichJobStatusEvent({
    error,
    id: job.id,
    status: 'error',
  });

/**
 * Shorthand to queue further enrich and add results of current enrich
 *
 * @param job - The job
 * @param result - The result of enrich
 *
 * @returns A promise that resolves when the event is sent
 */
const queueEnrichWithResult = (
  job: EnrichJobData,
  result: EnrichResult | null
): Promise<void> =>
  queueEnrichJob({
    ...job,
    enrich: {
      ...job.enrich,
      results: { ...job.enrich?.results, ...result },
    },
  });

/**
 * Shorthand to send enrich status events
 *
 * @param id - The job id
 * @param source - The source of enrich
 * @param status - From where the the data comes from
 *
 * @returns A promise that resolves when the event is sent
 */
const sendEnrichStatus = (
  id: string,
  source: EnrichSource,
  status: 'remote' | 'store' | 'miss' | 'skipped'
): Promise<void> =>
  sendEnrichJobStatusEvent({
    enrich: {
      sources: {
        [source]: {
          items: 1,
          miss: Number(status === 'miss'),
          remote: Number(status === 'remote'),
          store: Number(status === 'store'),
        },
      },
      status: 'processing',
    },
    id,
    status: 'processing',
  });

/**
 * Enrich report item using the given source
 *
 * @param source - The source of enrich
 * @param job - The job
 *
 * @returns Promise resolving when further fetch are possible
 */
export async function enrichReportItem(
  source: EnrichSource,
  job: EnrichJobData
): Promise<void> {
  void markJobAsProcessing(job);

  /**
   * Queue next step and notify status
   *
   * @param result - The result from enrich
   * @param status - From where the the data comes from
   *
   * @returns When next step is queued
   */
  const next = (
    result: EnrichResult | null,
    status: 'remote' | 'store' | 'miss' | 'skipped'
  ): Promise<void> => {
    void sendEnrichStatus(job.id, source, status);
    return queueEnrichWithResult(job, result);
  };

  try {
    switch (source) {
      case 'ezunpaywall':
        await enrichItemUsingEzUnpaywall(
          job.data,
          job.enrich?.ezunpaywall ?? {},
          next
        );
        break;

      case 'openalex':
        await enrichItemUsingOpenAlex(
          job.data,
          job.enrich?.openalex ?? {},
          next
        );
        break;

      default:
        throw new Error(`Enrich source ${source} is not implemented`);
    }
  } catch (error) {
    void markJobAsError(job, asHarvestError(error));
  }
}
