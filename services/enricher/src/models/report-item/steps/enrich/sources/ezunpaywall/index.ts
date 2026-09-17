import type { EnrichEzUnpaywallOptions } from '@ezcounter/dto/enrich';
import type { EnrichJobContent } from '@ezcounter/dto/queues';

import type { EzUnpaywallDocument } from './dto';
import { getDOIOfItem } from '../../identifiers';
import {
  type Enricher,
  type NextEnrich,
  createEnrichPipeline,
} from '../../pipeline';
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

type EzUnpaywallEnricher = Enricher<
  EnrichEzUnpaywallOptions,
  EnrichEzUnpaywalData
>;

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
 * Enrich item using DOI found
 *
 * @param job - The OpenAlex enrich job
 * @param job.content - The item to enrich
 * @param next - The next enrich part to call
 *
 * @returns Promise that resolves true when further fetch are possible
 */
const enrichWithDoi: EzUnpaywallEnricher = async ({ content }, next) => {
  // If Release is absent, it's a COUNTER 5 Report
  const release = content.header.Release || '5';

  // Resolve identifiers
  const doi = getDOIOfItem(content.item, release);
  if (!doi) {
    // oxlint-disable-next-line node/callback-return - callback and return have 2 different meaning
    await next(null, 'skipped');
    return true;
  }

  // Fetch item using found identifier
  await getDocumentByDOI(doi, (doc, status) =>
    next(doc && transformDocumentToEnrichData(doc), status)
  );

  return true;
};

/**
 * Get ezUnpaywall data for a given item
 *
 * @param content - The item to enrich
 * @param options - The options to use for ezUnpaywall enrichment
 * @param next - Callback with enriched data
 *
 * @returns Promise that resolves true when further fetch are possible
 */
export async function enrichItemUsingEzUnpaywall(
  content: EnrichJobContent,
  options: EnrichEzUnpaywallOptions,
  next: NextEnrich<EnrichEzUnpaywalData>
): Promise<true> {
  const resolve: EzUnpaywallEnricher = async ({ result }) => {
    // oxlint-disable-next-line node/callback-return
    await next(result.data, result.status);
    return true;
  };

  await createEnrichPipeline([enrichWithDoi, resolve], {
    content,
    options,
  });

  return true;
}
