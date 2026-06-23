import { describe, expect, it, vi } from 'vitest';

import { createStore } from '~/lib/store';

import { createEzUnpaywallRemote, createEzUnpaywallStore } from '.';
import { EzUnpaywallRemote } from './ezunpaywall';

vi.mock(import('./ezunpaywall'));

describe('create store', () => {
  it('should create store', () => {
    expect.hasAssertions();
    createEzUnpaywallStore();

    expect(createStore).toHaveBeenCalledExactlyOnceWith(
      // Might break previous installs
      'unpaywall',
      expect.objectContaining({
        // TTL should be transformed to a number
        ttl: expect.any(Number),
      })
    );
  });
});

describe('create remote', () => {
  it('should create remote', () => {
    expect.hasAssertions();
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
