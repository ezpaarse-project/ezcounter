import { Keyv } from 'keyv';

import { createKeyvRedis } from './redis';

/**
 * Setup Keyv store
 *
 * @param namespace - Namespace for the keyv instance
 *
 * @returns Keyv instance
 */
export function createStore<DataType = unknown>(
  namespace: string
): Keyv<DataType> {
  const store = new Keyv({
    namespace,
    store: createKeyvRedis<DataType>(),
    useKeyPrefix: false,
  });

  return store;
}
