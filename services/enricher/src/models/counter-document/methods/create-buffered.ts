import { createThrottledFunction } from '@ezcounter/toolbox/utils';

import type { CreateCOUNTERDocument } from '../dto';
import { createManyCOUNTERDocument } from './create';

const MAX_BUFFER_SIZE = 1000;
const INSERT_THROTTLE = 5000;

type BufferedCreateOnePayload = {
  document: CreateCOUNTERDocument & Record<string, unknown>;
  id: string;
  index: string;
  onCreated?: (type: 'created' | 'updated' | null) => void;
};

const buffer: BufferedCreateOnePayload[] = [];

/**
 * Create many COUNTER document present in the buffer then resolves callbacks
 */
const throttledCreateMany = createThrottledFunction(async () => {
  const items = [...buffer];
  buffer.length = 0;

  const results = await createManyCOUNTERDocument(items);

  // Iterate overs input to properly resolves all callbacks
  return items.map((item) => {
    if (results.created.some((id) => item.id === id)) {
      return item.onCreated?.('created');
    }
    if (results.updated.some((id) => item.id === id)) {
      return item.onCreated?.('updated');
    }
    return item.onCreated?.(null);
  });
}, INSERT_THROTTLE);

/**
 * Create one COUNTER document by adding it to a buffer
 *
 * @param document - The document with callback called when item is inserted
 *
 * @returns Promise that is resolved when buffer allows for more writes
 */
export async function bufferedCreateOneCOUNTERDocument(
  document: BufferedCreateOnePayload
): Promise<void> {
  buffer.push(document);
  const promise = throttledCreateMany();

  if (buffer.length >= MAX_BUFFER_SIZE) {
    await promise;
  }
}
