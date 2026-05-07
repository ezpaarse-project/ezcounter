import { createDebouncedFunction } from '@ezcounter/toolbox/utils';

import type { OpenAlexWork } from '../dto';
import type { IOpenAlexRemote } from './remotes/types';

const MAX_BUFFER_SIZE = 100;
const FETCH_MANY_DEBOUNCE = 1000;

type BufferedPayload = {
  doi: string;
  onFetched?: (doc: OpenAlexWork | null) => void;
};

const buffer: BufferedPayload[] = [];

/**
 * Fetch works from OpenAlex using DOIs present in the buffer then resolves callbacks
 */
const debouncedFetchMany = createDebouncedFunction(
  async (remote: IOpenAlexRemote) => {
    const items = [...buffer];
    buffer.length = 0;

    const results = await remote.fetchManyWorkByDOI(
      items.map(({ doi }) => doi)
    );

    // Iterate overs input to properly resolves all callbacks
    return items.map((item) => {
      const result = results.find(
        ({ ids }) => ids.doi === `https://doi.org/${item.doi}`
      );
      return item.onFetched?.(result ?? null);
    });
  },
  FETCH_MANY_DEBOUNCE
);

/**
 * Fetch one work from OpenAlex by adding it to a buffer
 *
 * @param remote - The OpenAlex remote
 * @param doi - The doi
 * @param onFetched - Callback called when item is fetched
 *
 * @returns Promise that is resolved when buffer allows for more writes
 */
export async function bufferedFetchOneWorkByDOI(
  remote: IOpenAlexRemote,
  doi: string,
  onFetched?: (doc: OpenAlexWork | null) => void
): Promise<void> {
  buffer.push({ doi, onFetched });
  const promise = debouncedFetchMany(remote);

  if (buffer.length >= MAX_BUFFER_SIZE) {
    await promise;
  }
}
