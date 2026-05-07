import { KeyvLz4 } from '@keyv/compress-lz4';
import { Keyv } from 'keyv';

import { createKeyvRedis } from './redis';

/**
 * Setup Keyv store
 *
 * @param namespace - Namespace for the keyv instance
 * @param options - Keyv options
 *
 * @returns Keyv instance
 */
export function createStore<DataType = unknown>(
  namespace: string,
  options?: { ttl?: number; compression?: boolean }
): Keyv<DataType> {
  const store = new Keyv({
    namespace,
    store: createKeyvRedis<DataType>(namespace),
    useKeyPrefix: false,
    ...options,
    compression: options?.compression ? new KeyvLz4() : undefined,
  });

  return store;
}
