import { type $Fetch, ofetch } from 'ofetch';

import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json';

import type { OpenAlexWork } from '../../../dto';
import type { IOpenAlexRemote } from '../types';
import { CNRSGatewayResponse } from './dto';

const logger = appLogger.child({ scope: 'enrich', source: 'openalex' });

type CNRSGatewayRemoteConfig = {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retry: number;
  retryDelay: number;
};

/**
 * Wrapper around CNRS's OpenAlex gateway to fetch OpenAlex data
 *
 * @see ...
 */
export class CNRSGatewayRemote implements IOpenAlexRemote {
  private $fetch: $Fetch;

  constructor(config: CNRSGatewayRemoteConfig) {
    this.$fetch = ofetch.create({
      baseURL: config.baseUrl,
      headers: {
        'User-Agent': `Mozilla/5.0 (compatible; ezCOUNTER/enricher:${appVersion})`,
        'X-API-Key': config.apiKey,
      },
      method: 'POST',
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
    try {
      const response = await this.$fetch('/', {
        body: [...new Set(dois)],
      });

      const { data } = CNRSGatewayResponse.parse(response);
      logger.debug({
        count: data.length,
        dois: dois.length,
        msg: 'Got works from OpenAlex',
      });

      return data;
    } catch (error) {
      logger.warn({
        dois: dois.length,
        err: error,
        msg: 'Failed to fetch works',
      });
    }
    return [];
  }
}
