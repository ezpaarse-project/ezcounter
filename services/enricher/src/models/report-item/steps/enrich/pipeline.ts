import type { EnrichJobContent } from '@ezcounter/dto/queues';

/**
 * Possible status for enrich part with priority
 */
enum ENRICH_STATUS_PRIORITIES {
  miss = 0,
  remote = 3,
  skipped = 1,
  store = 2,
}

type EnrichResult<EnrichData> = {
  data: EnrichData | null;
  status: EnrichStatus;
};

/**
 * Resolve status using priorities
 *
 * @param previous - The previous status
 * @param current - The current status
 *
 * @returns The new status
 */
const getEnrichStatus = (
  previous: EnrichStatus,
  current: EnrichStatus
): EnrichStatus =>
  ENRICH_STATUS_PRIORITIES[
    Math.max(
      ENRICH_STATUS_PRIORITIES[previous],
      ENRICH_STATUS_PRIORITIES[current]
    )
  ] as EnrichStatus;

export type EnrichStatus = keyof typeof ENRICH_STATUS_PRIORITIES;

/**
 * Type for next function in enricher pipeline
 */
export type NextEnrich<EnrichData> = (
  data: EnrichData | null,
  status: EnrichStatus
) => Promise<void>;

/**
 * Type for defining enricher
 */
export type Enricher<EnrichOptions, EnrichData> = (
  job: {
    content: EnrichJobContent;
    options: EnrichOptions;
    result: EnrichResult<EnrichData>;
  },
  next: NextEnrich<EnrichData>
) => Promise<true>;

/**
 * Create pipeline for enrich jobs
 *
 * @param enrichers - The enrichers to chain
 * @param params - The params to pass to all enrichers
 *
 * @returns The result of the pipeline
 */
export async function createEnrichPipeline<
  EnrichOptions,
  EnrichData extends Record<string, unknown>,
>(
  enrichers: Enricher<EnrichOptions, EnrichData>[],
  params: { content: EnrichJobContent; options: EnrichOptions }
): Promise<true> {
  // No need to pipeline
  if (enrichers.length <= 0) {
    return true;
  }

  const [first, ...parts] = enrichers;
  // Data to resolve - Will be updated by parts
  const previous: EnrichResult<EnrichData> = { data: null, status: 'miss' };
  // Payload to pass to parts
  const payload = { ...params, result: previous };

  /**
   * Create next handler after current part resolved data
   *
   * @param index - The index of the part
   *
   * @returns The next handler
   */
  const resolveChain = (index = 0): NextEnrich<EnrichData> => {
    if (index >= parts.length) {
      return () => Promise.resolve();
    }

    return async (result, status) => {
      previous.status = getEnrichStatus(previous.status, status);
      previous.data =
        previous.data || result
          ? ({ ...previous.data, ...result } as EnrichData)
          : null;

      await parts[index](payload, resolveChain(index + 1));
    };
  };

  // Resolve chain then call first part using chain
  const chain = resolveChain();
  await first(payload, chain);

  return true;
}
