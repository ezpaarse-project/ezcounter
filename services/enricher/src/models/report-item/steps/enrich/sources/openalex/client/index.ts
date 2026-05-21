import { appLogger } from '~/lib/logger';

import { OpenAlexWork } from '../dto';
import { createOpenAlexRemote, createOpenAlexStore } from './remotes';
import { bufferedFetchOneWorkByDOI } from './works';

const logger = appLogger.child({ scope: 'enrich', source: 'openalex' });

const store = createOpenAlexStore();
const remote = createOpenAlexRemote();

/**
 * Get OpenAlex work by DOI, either from cache or from remote
 *
 * @param doi - The DOI of the work
 * @param onWork - Callback resolving with the OpenAlex work or null if not found
 *
 * @returns Promise that resolves true when further fetch are possible
 */
export async function getWorkByDOI(
  doi: string,
  onWork: (
    doc: OpenAlexWork | null,
    status: 'remote' | 'store'
  ) => Promise<void>
): Promise<true> {
  const cacheKey = `work:doi:${doi}`;

  try {
    const stored = await store.get(cacheKey);
    if (stored) {
      await onWork(OpenAlexWork.parse(stored), 'store');
      return true;
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

  return true;
}
