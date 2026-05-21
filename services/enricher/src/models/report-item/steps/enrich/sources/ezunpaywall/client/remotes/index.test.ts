import { describe, expect, test, vi } from 'vitest';

import { createStore } from '~/lib/keyv/__mocks__';

import { EzUnpaywallRemote } from './ezunpaywall/__mocks__';
import { createEzUnpaywallRemote, createEzUnpaywallStore } from './index';

vi.mock(import('./ezunpaywall'));

describe('Create store (createEzUnpaywallStore)', () => {
  test('should create store', () => {
    createEzUnpaywallStore();

    expect(createStore).toHaveBeenCalledExactlyOnceWith(
      // Might break previous installs
      'unpaywall',
      expect.objectContaining({
        // Might break previous installs
        compression: false,
        // TTL should be transformed to a number
        ttl: expect.any(Number),
      })
    );
  });
});

describe('Create remote (createEzUnpaywallRemote)', () => {
  test('should create remote', () => {
    createEzUnpaywallRemote();

    expect(EzUnpaywallRemote).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        // Retry delay should be transformed to a number
        retryDelay: expect.any(Number),
        // Timeout should be transformed to a number
        timeout: expect.any(Number),
      })
    );
  });
});
