import { setTimeout } from 'node:timers/promises';

import { type $Fetch, ofetch } from 'ofetch';

import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import {
  dependencies as appDeps,
  homepage as appHomepage,
  version as appVersion,
} from '~/../package.json' with { type: 'json' };

import type { OpenAlexWork } from '../../../dto';
import type { IOpenAlexRemote } from '../types';
import { OpenAlexResponse } from './dto';
import { oqo } from './oqo';

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
 * Format Work from OpenAlex into something more usable
 *
 * @param work - The work to format
 *
 * @returns The formatted work
 */
const formatWork = (work: OpenAlexWork): OpenAlexWork => {
  // Remove URL from ids
  work.ids = {
    ...work.ids,
    doi: work.ids.doi.replace('https://doi.org/', ''),
    openalex: work.ids.openalex.replace('https://openalex.org/', ''),
  };

  return work;
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
        'User-Agent': `Mozilla/5.0 (compatible; ezCOUNTER/enricher:${appVersion}; +${appHomepage}); ofetch/${appDeps.ofetch.slice(1)}`,
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
    const works: OpenAlexWork[] = [];

    const items = [...new Set(dois)];
    const query = oqo
      .works()
      .where(oqo.or(...items.map((doi) => oqo.is('doi', doi))));

    let cursor: string | null = '*';
    while (cursor !== null) {
      try {
        // oxlint-disable-next-line no-await-in-loop
        const response = await this.$fetch('/', {
          body: {
            cursor,
            oqo: query,
            // Maximum allowed by OpenAlex
            per_page: 200,
            select: FIELDS,
            sort: 'doi',
          },
          method: 'POST',
        });

        const { meta, results } = OpenAlexResponse.parse(response);

        for (const work of results) {
          works.push(formatWork(work));
        }
        cursor = meta.next_cursor;
      } catch (error) {
        logger.warn({
          err: error,
          msg: 'Failed to fetch works',
          requestCount: dois.length,
        });
        break;
      }
      // oxlint-disable-next-line no-await-in-loop
      await setTimeout(RATE_LIMIT_DELAY);
    }

    logger.debug({
      msg: 'Got works from OpenAlex',
      requestCount: dois.length,
      resultCount: works.length,
    });

    return works;
  }
}
