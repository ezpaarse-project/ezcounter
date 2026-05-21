import { type $Fetch, ofetch } from 'ofetch';

import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json';

import type { EzUnpaywallDocument } from '../../../dto';
import type { IEzUnpaywallRemote } from '../types';
import { EzUnpaywallResponse } from './dto';

const logger = appLogger.child({ scope: 'enrich', source: 'ezunpaywall' });

type EzUnpaywallConfig = {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retry: number;
  retryDelay: number;
};

export class EzUnpaywallRemote implements IEzUnpaywallRemote {
  private $fetch: $Fetch;

  constructor(config: EzUnpaywallConfig) {
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
   * Fetch many documents from ezUnpaywall by DOIs
   *
   * @see https://unpaywall.inist.fr/open-api
   *
   * @param dois - The list of DOIs
   *
   * @returns The results
   */
  public async fetchManyDocumentByDOI(
    dois: string[]
  ): Promise<EzUnpaywallDocument[]> {
    try {
      const response = await this.$fetch('/', {
        body: {
          query: `query GetByDOI($dois: [ID!]!) {
            unpaywall(dois: $dois) {
              doi
              is_oa
              title
              oa_status
              data_standard
              genre
              year
              journal_issns
              journal_issn_l
              journal_is_oa
            }
          }`,
          variables: {
            // Dedupe DOIs
            dois: [...new Set(dois)],
          },
        },
      });

      const { data, errors } = EzUnpaywallResponse.parse(response);
      if (data.unpaywall && data.unpaywall.length > 0) {
        logger.debug({
          msg: 'Got documents from ezUnpaywall',
          requestCount: dois.length,
          resultCount: data.unpaywall.length,
        });
        return data.unpaywall;
      }
      throw new Error(errors?.[0]?.message || 'Unknown error from ezUNPAYWALL');
    } catch (error) {
      logger.warn({
        err: error,
        msg: 'Failed to fetch documents',
        requestCount: dois.length,
      });
    }
    return [];
  }
}
