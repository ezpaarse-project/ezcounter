import type { EnrichEzUnpaywallOptions } from '@ezcounter/dto/enrich';
import type { EnrichJobContent } from '@ezcounter/dto/queues';

import type { EzUnpaywallDocument } from './dto';
import { getDOIOfItem } from '../../identifiers';
import { getDocumentByDOI } from './client';

/**
 * Type for the enriched data from ezUnpaywall
 */
type EnrichEzUnpaywalData = {
  X_EzUnpaywall: {
    doi: string;
    is_oa?: boolean;
    journal_is_oa?: boolean;
    journal_issn_l?: string;
    journal_issns?: string;
    oa_status?: string;
    year?: number;
  };
};
/**
 * Transform document from ezUnpaywall into enrich data added to documents
 *
 * @param doc - The document from ezUnpaywall
 *
 * @returns The enrich Data
 */
const transformDocumentToEnrichData = (
  doc: EzUnpaywallDocument
): EnrichEzUnpaywalData => ({
  X_EzUnpaywall: {
    doi: doc.doi,
    is_oa: doc.is_oa ?? undefined,
    journal_is_oa: doc.journal_is_oa ?? undefined,
    journal_issn_l: doc.journal_issn_l ?? undefined,
    journal_issns: doc.journal_issns ?? undefined,
    oa_status: doc.oa_status ?? undefined,
    year: doc.year ?? undefined,
  },
});

/**
 * Get ezUnpaywall data for a given item
 *
 * @param data - The item to enrich
 * @param options - The options to use for ezUnpaywall enrichment
 * @param next - Callback with enriched data
 *
 * @returns Promise resolving when further fetch are possible
 */
export async function enrichItemUsingEzUnpaywall(
  data: EnrichJobContent,
  options: EnrichEzUnpaywallOptions,
  next: (
    data: EnrichEzUnpaywalData | null,
    status: 'remote' | 'store' | 'miss' | 'skipped'
  ) => Promise<void>
): Promise<void> {
  // If Release is absent, it's a COUNTER 5 Report
  const release = data.header.Release || '5';

  // Resolve identifiers
  const doi = getDOIOfItem(data.item, release);
  if (!doi) {
    next(null, 'skipped');
    return;
  }

  // Fetch item using found identifier
  await getDocumentByDOI(doi, (doc, status) => {
    if (!doc) {
      return next(null, 'miss');
    }

    return next(transformDocumentToEnrichData(doc), status);
  });
}
