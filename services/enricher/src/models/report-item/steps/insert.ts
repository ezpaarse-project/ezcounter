import type { EnrichJobData } from '@ezcounter/dto/queues';

import type { BulkIndexResult } from '~/lib/elasticsearch';

import { CounterDocumentInserter } from '~/models/counter-document/inserter';

import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { transformReportItemToDocuments } from '../../counter-document/transform';

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
    current: 'insert',
    id,
    insert: {
      coveredMonths: [...coveredMonths],
      done: false,
      insertedItems: stats.created,
      updatedItems: stats.updated,
    },
    status: 'processing',
  });

/**
 * Shorthand to send insert success event
 *
 * @param id - The job id
 *
 * @returns A promise that resolves when the event is sent
 */
const sendInsertSuccess = (id: string): Promise<void> =>
  sendEnrichJobStatusEvent({
    current: 'insert',
    id,
    insert: {
      done: true,
    },
    status: 'processing',
  });

/**
 * Insert the report item and notify
 *
 * @param enrichData - The data from the enrich step
 * @param options - The options for the insert step
 */
export async function insertReportItem(
  enrichData: Record<string, unknown>,
  options: EnrichJobData
): Promise<void> {
  const coveredMonths = new Set<string>();
  const stats = { created: 0, updated: 0 };

  const docs = new CounterDocumentInserter((result: BulkIndexResult): void => {
    stats.created += result.created;
    stats.updated += result.updated;
    void sendInsertStatus(options.id, stats, coveredMonths);
  });

  for (const document of transformReportItemToDocuments(
    options.data,
    options.insert
  )) {
    coveredMonths.add(document.X_Date_Month);

    // oxlint-disable-next-line no-await-in-loop
    await docs.createOneCOUNTERDocument({
      ...options.insert.additionalData,
      ...document,
      ...enrichData,
      _id: document._id,
      _index: options.insert.index,
    });
  }

  await docs.waitLastDocumentCreation();
  void sendInsertSuccess(options.id);
}
