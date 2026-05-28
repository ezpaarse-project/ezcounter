import { Cacheable } from 'cacheable';
import { Keyv } from 'keyv';
import { LRUCache } from 'lru-cache';

import { createKeyvRedis } from './redis';

/**
 * Options used to setup store
 */
type StoreOptions = {
  /** TTL for data (in milliseconds) */
  ttl?: number;
  /** Options specific to Layer 1 (LRU cache) */
  l1: {
    /** Number of items to store in Layer 1 */
    size: number;
  };
};

export type Store = Cacheable;

/**
 * Setup store
 *
 * @param namespace - Namespace for the keyv instance
 * @param options - Store options
 *
 * @returns Keyv instance
 */
export function createStore(namespace: string, options: StoreOptions): Store {
  const primary = new Keyv({
    store: new LRUCache({ max: options.l1.size, ttl: options.ttl }),
  });

  const secondary = new Keyv({
    store: createKeyvRedis(namespace),
    ttl: options.ttl,
    useKeyPrefix: false,
  });

  return new Cacheable({ namespace, primary, secondary });
}
