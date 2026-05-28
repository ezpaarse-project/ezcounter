import { createDebouncedFunction } from '@ezcounter/toolbox/utils';

import type { EzUnpaywallDocument } from '../dto';
import type { IEzUnpaywallRemote } from './remotes/types';
import { FETCH_MANY_DEBOUNCE, MAX_BUFFER_SIZE } from './constants';

type BufferedPayload = {
  doi: string;
  onFetched: (doc: EzUnpaywallDocument | null) => void;
};

const buffer: BufferedPayload[] = [];

/**
 * Fetch documents from ezUnpaywall using DOIs present in the buffer then resolves callbacks
 */
const debouncedFetchMany = createDebouncedFunction(
  async (remote: IEzUnpaywallRemote) => {
    const items = [...buffer];
    buffer.length = 0;

    const results = await remote.fetchManyDocumentByDOI(
      items.map(({ doi }) => doi)
    );

    // Iterate overs input to properly resolves all callbacks
    return items.map((item) => {
      const result = results.find(({ doi }) => doi === item.doi);
      return item.onFetched(result ?? null);
    });
  },
  FETCH_MANY_DEBOUNCE
);

/**
 * Fetch one document from ezUnpaywall by adding it to a buffer
 *
 * @param remote - ezUnpaywall remote
 * @param doi - The doi
 * @param onFetched - Callback called when item is fetched
 *
 * @returns Promise that resolves true when buffer allows for more writes
 */
export async function bufferedFetchOneDocumentByDOI(
  remote: IEzUnpaywallRemote,
  doi: string,
  onFetched: (doc: EzUnpaywallDocument | null) => void
): Promise<true> {
  buffer.push({ doi, onFetched });
  const promise = debouncedFetchMany(remote);

  if (buffer.length >= MAX_BUFFER_SIZE) {
    await promise;
  }

  return true;
}
