import type { HarvestInsertOptions } from '@ezcounter/dto/harvest';
import type { EnrichJobContent } from '@ezcounter/dto/queues';

import type { CreateCOUNTERDocument } from '../dto';
import { type R5ReportData, transformR5ItemToDocuments } from './r5';
import { type R51ReportData, transformR51ItemToDocuments } from './r51';

/**
 * Transform COUNTER data from report into a COUNTER Document
 *
 * @param data - The COUNTER data
 * @param options - The options to use when inserting the documents
 *
 * @yields The transformed documents with their id
 *
 * @returns When all documents have been transformed
 */
export function transformReportItemToDocuments(
  data: EnrichJobContent,
  options: HarvestInsertOptions
): Generator<CreateCOUNTERDocument & { _id: string }> {
  switch (data.header.Release) {
    case '5':
      return transformR5ItemToDocuments(data as R5ReportData, options);
    case '5.1':
      return transformR51ItemToDocuments(data as R51ReportData, options);

    default:
      throw new Error(`COUNTER Release ${data.header.Release} is unknown`);
  }
}
