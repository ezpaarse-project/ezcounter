import type { EnrichOpenAlexOptions } from '@ezcounter/dto/enrich';
import type { EnrichJobContent } from '@ezcounter/dto/queues';

import type { OpenAlexWork } from './dto';
import { getDOIOfItem } from '../../identifiers';
import { getWorkByDOI } from './client';

/**
 * Type for the enriched data from OpenAlex
 */
type EnrichOpenAlexData = {
  X_OpenAlex: {
    countries: string[];
    domain?: string;
    ids: Record<string, string | null>;
    is_oa: boolean;
    language?: string;
    oa_status: 'diamond' | 'gold' | 'hybrid' | 'bronze' | 'green' | 'closed';
    publication_year?: number;
    title?: string;
  };
};

/**
 * Transform work from OpenAlex into enrich data added to documents
 *
 * @param work - The work from OpenAlex
 *
 * @returns The enrich Data
 */
const transformWorkToEnrichData = (work: OpenAlexWork): EnrichOpenAlexData => {
  // Guess countries of publication by looking at first author
  const countries = [
    ...new Set<string>(
      work.authorships
        .find(({ author_position }) => author_position === 'first')
        ?.institutions?.map((institution) => institution.country_code)
        // oxlint-disable-next-line unicorn/prefer-native-coercion-functions - Type Guard
        .filter((value): value is string => Boolean(value))
    ),
  ];

  return {
    X_OpenAlex: {
      countries,
      domain: work.primary_topic?.domain.display_name,
      ids: {
        doi: work.ids.doi,
        mag: work.ids.mag ?? null,
        openalex: work.ids.openalex,
        pmcid: work.ids.pmcid ?? null,
        pmid: work.ids.pmid ?? null,
      },
      is_oa: work.open_access.is_oa,
      language: work.language ?? undefined,
      oa_status: work.open_access.oa_status,
      publication_year: work.publication_year ?? undefined,
      title: work.title ?? undefined,
    },
  };
};

/**
 * Get OpenAlex data for a given item
 *
 * @param data - The item to enrich
 * @param options - The options to use for OpenAlex enrichment
 * @param next - Callback with enriched data
 *
 * @returns The enriched data
 */
export async function enrichItemUsingOpenAlex(
  data: EnrichJobContent,
  options: EnrichOpenAlexOptions,
  next: (
    data: EnrichOpenAlexData | null,
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
  await getWorkByDOI(doi, (work, status) => {
    if (!work) {
      return next(null, 'miss');
    }

    return next(transformWorkToEnrichData(work), status);
  });
}
