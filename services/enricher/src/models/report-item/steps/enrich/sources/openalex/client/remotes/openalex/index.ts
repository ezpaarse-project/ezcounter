import { setTimeout } from 'node:timers/promises';

import { type $Fetch, ofetch } from 'ofetch';

import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json';

import type { OpenAlexWork } from '../../../dto';
import type { IOpenAlexRemote } from '../types';
import { OpenAlexResponse } from './dto';

const logger = appLogger.child({ scope: 'enrich', source: 'openalex' });

/**
 * OpenAlex API allows 100 requests per second
 *
 * A delay of 50ms allows us to fetch 20 pages in one second
 *
 * @see https://developers.openalex.org/api-reference/authentication#exceeding-limits
 */
const RATE_LIMIT_DELAY = 50;
const FIELDS = [
  'authorships',
  'ids',
  'language',
  'open_access',
  'primary_topic',
  'publication_year',
  'title',
].join(',');

type OpenAlexRemoteConfig = {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retry: number;
  retryDelay: number;
};

/**
 * Wrapper around OpenAlex API to fetch OpenAlex data
 *
 * @see https://developers.openalex.org/api-reference/
 */
export class OpenAlexRemote implements IOpenAlexRemote {
  private $fetch: $Fetch;

  constructor(config: OpenAlexRemoteConfig) {
    this.$fetch = ofetch.create({
      baseURL: config.baseUrl,
      headers: {
        'User-Agent': `Mozilla/5.0 (compatible; ezCOUNTER/enricher:${appVersion})`,
      },
      query: {
        api_key: config.apiKey,
      },
      retry: config.retry,
      retryDelay: config.retryDelay,
      timeout: config.timeout,
    });
  }

  /**
   * Fetch many works from OpenAlex by DOIs
   *
   * @param dois - The list of DOIs
   *
   * @returns The results
   */
  public async fetchManyWorkByDOI(dois: string[]): Promise<OpenAlexWork[]> {
    // Dedupe DOIs and format query
    const query = [...new Set(dois)].join('|');
    const works: OpenAlexWork[] = [];

    let cursor: string | null = '*';
    while (cursor !== null) {
      try {
        // oxlint-disable-next-line no-await-in-loop
        const response = await this.$fetch('/works', {
          query: {
            cursor,
            filter: `doi:${query}`,
            per_page: 100,
            select: FIELDS,
            sort: 'doi',
          },
        });

        const { meta, results } = OpenAlexResponse.parse(response);

        works.push(...results);
        cursor = meta.next_cursor;
      } catch (error) {
        logger.warn({
          dois: dois.length,
          err: error,
          msg: 'Failed to fetch works',
        });
        break;
      }
      // oxlint-disable-next-line no-await-in-loop
      await setTimeout(RATE_LIMIT_DELAY);
    }

    logger.debug({
      count: works.length,
      dois: dois.length,
      msg: 'Got works from OpenAlex',
    });

    return works;
  }
}
