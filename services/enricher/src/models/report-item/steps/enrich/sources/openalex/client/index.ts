import { milliseconds } from 'date-fns';

import { appConfig } from '~/lib/config';
import { createStore } from '~/lib/keyv';
import { appLogger } from '~/lib/logger';

import { OpenAlexWork } from '../dto';
import { CNRSGatewayRemote, OpenAlexRemote } from './remotes';
import { bufferedFetchOneWorkByDOI } from './works';

const { openalex: config } = appConfig.enrich.sources;
const logger = appLogger.child({ scope: 'enrich', source: 'openalex' });

const store = createStore('openalex', {
  compression: false, // TODO: fix compression
  ttl: milliseconds(config.storeTtl),
});

const remote = config.isCNRSGateway
  ? new CNRSGatewayRemote({
      ...config,
      retryDelay:
        config.retryDelay.milliseconds || milliseconds(config.retryDelay),
      timeout: config.timeout.milliseconds || milliseconds(config.timeout),
    })
  : new OpenAlexRemote({
      ...config,
      retryDelay:
        config.retryDelay.milliseconds || milliseconds(config.retryDelay),
      timeout: config.timeout.milliseconds || milliseconds(config.timeout),
    });

/**
 * Get OpenAlex work by DOI, either from cache or from remote
 *
 * @param doi - The DOI of the work
 * @param onWork - Callback resolving with the OpenAlex work or null if not found
 *
 * @returns The OpenAlex work or null if not found
 */
export async function getWorkByDOI(
  doi: string,
  onWork: (
    doc: OpenAlexWork | null,
    status: 'remote' | 'store'
  ) => Promise<void>
): Promise<void> {
  const cacheKey = `work:doi:${doi}`;

  try {
    const stored = await store.get(cacheKey);
    if (stored) {
      await onWork(OpenAlexWork.parse(stored), 'store');
      return;
    }
  } catch (error) {
    logger.warn({
      doi,
      err: error,
      msg: 'Failed to get data from store',
    });
  }

  await bufferedFetchOneWorkByDOI(remote, doi, async (work) => {
    if (work) {
      try {
        await store.set(cacheKey, work);
      } catch (error) {
        logger.warn({
          doi,
          err: error,
          msg: 'Failed to set data from store',
        });
      }
    }

    return onWork(work, 'remote');
  });
}
