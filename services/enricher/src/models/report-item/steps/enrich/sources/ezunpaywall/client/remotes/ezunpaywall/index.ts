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
    // Dedupe DOIs and format query
    const query = [...new Set(dois)].map((doi) => `"${doi}"`).join(',');

    try {
      const response = await this.$fetch('/', {
        body: {
          query: `{
            unpaywall(dois: [${query}]) {
              doi
              is_oa
              oa_status
              year
              journal_issns
              journal_issn_l
              journal_is_oa
            }
          }`,
        },
      });

      const { data, errors } = EzUnpaywallResponse.parse(response);
      if (data.unpaywall) {
        logger.debug({
          count: data.unpaywall.length,
          dois: dois.length,
          msg: 'Got documents from ezUnpaywall',
        });
        return data.unpaywall;
      }
      throw new Error(errors?.[0]?.message || 'Unknown error from ezUNPAYWALL');
    } catch (error) {
      logger.warn({
        dois: dois.length,
        err: error,
        msg: 'Failed to fetch documents',
      });
    }
    return [];
  }
}
