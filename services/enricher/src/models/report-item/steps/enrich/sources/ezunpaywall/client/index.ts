import { milliseconds } from 'date-fns';

import { appConfig } from '~/lib/config';
import { createStore } from '~/lib/keyv';
import { appLogger } from '~/lib/logger';

import { EzUnpaywallDocument } from '../dto';
import { bufferedFetchOneDocumentByDOI } from './documents';
import { EzUnpaywallRemote } from './remotes';

const { ezunpaywall: config } = appConfig.enrich.sources;
const logger = appLogger.child({ scope: 'enrich', source: 'ezunpaywall' });

const store = createStore('unpaywall', {
  compression: false, // TODO: fix compression
  ttl: milliseconds(config.storeTtl),
});

const remote = new EzUnpaywallRemote({
  ...config,
  retryDelay: config.retryDelay.milliseconds || milliseconds(config.retryDelay),
  timeout: config.timeout.milliseconds || milliseconds(config.timeout),
});

/**
 * Get ezUnpaywall document by DOI, either from cache or from remote
 *
 * @param doi - The DOI of the document
 * @param onDocument - Callback resolving with the ezUnpaywall document or null if not found
 *
 * @returns Promise resolving when further fetch are possible
 */
export async function getDocumentByDOI(
  doi: string,
  onDocument: (
    doc: EzUnpaywallDocument | null,
    status: 'remote' | 'store'
  ) => Promise<void>
): Promise<void> {
  const cacheKey = `document:doi:${doi}`;

  try {
    const stored = await store.get(cacheKey);
    if (stored) {
      await onDocument(EzUnpaywallDocument.parse(stored), 'store');
      return;
    }
  } catch (error) {
    logger.warn({
      doi,
      err: error,
      msg: 'Failed to get data from store',
    });
  }

  await bufferedFetchOneDocumentByDOI(remote, doi, async (doc) => {
    if (doc) {
      try {
        await store.set(cacheKey, doc);
      } catch (error) {
        logger.warn({
          doi,
          err: error,
          msg: 'Failed to set data from store',
        });
      }
    }

    return onDocument(doc, 'remote');
  });
}
