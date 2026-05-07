import type { HarvestError } from '@ezcounter/dto/harvest';
import type { EnrichJobData } from '@ezcounter/dto/queues';
import { asHarvestError } from '@ezcounter/toolbox/harvest';
import { createDebouncedFunction } from '@ezcounter/toolbox/utils';

import { bufferedCreateOneCOUNTERDocument } from '~/models/counter-document';

import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { transformReportItemToDocuments } from './transform';

const NOTIFY_DEBOUNCE = 250;

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
 * Shorthand to send insert status events
 *
 * @param id - The job id
 * @param stats - The stats
 * @param coveredMonths - The covered months
 *
 * @returns A promise that resolves when the event is sent
 */
const sendInsertStatus = (
  id: string,
  stats: { created: number; updated: number },
  coveredMonths: Set<string>
): Promise<void> =>
  sendEnrichJobStatusEvent({
    id,
    insert: {
      coveredMonths: [...coveredMonths],
      created: stats.created,
      // Notifier is debounced per Report_Item (message in queue)
      items: 1,
      status: 'processing',
      updated: stats.updated,
    },
    status: 'processing',
  });

/**
 * Insert the report item and notify
 *
 * @param job - The options for the insert step
 *
 * @returns Promise resolving when further inserts are possible
 */
export async function insertReportItem(job: EnrichJobData): Promise<void> {
  void markJobAsProcessing(job);

  const coveredMonths = new Set<string>();
  const stats = { created: 0, updated: 0 };

  // Debounce notifications to avoid spam - local to report item
  const debouncedNotifier = createDebouncedFunction(
    sendInsertStatus,
    NOTIFY_DEBOUNCE
  );

  for (const item of transformReportItemToDocuments(job.data, job.insert)) {
    coveredMonths.add(item.document.X_Date_Month);

    try {
      // oxlint-disable-next-line no-await-in-loop
      await bufferedCreateOneCOUNTERDocument({
        ...item,
        document: {
          ...job.insert.additionalData,
          ...item.document,
          ...job.enrich?.results,
        },
        index: job.insert.index,
        onCreated: (type) => {
          if (type) {
            stats[type] += 1;
            void debouncedNotifier(job.id, stats, coveredMonths);
          }
        },
      });
    } catch (error) {
      void markJobAsError(job, asHarvestError(error));
      break;
    }
  }
}
