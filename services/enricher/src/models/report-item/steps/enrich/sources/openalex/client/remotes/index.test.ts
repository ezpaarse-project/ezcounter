import { describe, expect, test, vi } from 'vitest';

import { appConfig } from '~/lib/config';
import { createStore } from '~/lib/store';

import { CNRSGatewayRemote } from './cnrs-gateway';
import { createOpenAlexRemote, createOpenAlexStore } from './index';
import { OpenAlexRemote } from './openalex';

vi.mock(import('./cnrs-gateway'));
vi.mock(import('./openalex'));

describe('Create store (createOpenAlexStore)', () => {
  test('should create store', () => {
    createOpenAlexStore();

    expect(createStore).toHaveBeenCalledExactlyOnceWith(
      // Might break previous installs
      'openalex',
      expect.objectContaining({
        // TTL should be transformed to a number
        ttl: expect.any(Number),
      })
    );
  });
});

describe('Create remote (createOpenAlexRemote)', () => {
  test('should create OpenAlex remote', () => {
    // Spoof config
    vi.mocked(appConfig).enrich.sources.openalex.isCNRSGateway = false;

    createOpenAlexRemote();

    expect(OpenAlexRemote).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        // Retry delay should be transformed to a number
        retryDelay: expect.any(Number),
        // Timeout should be transformed to a number
        timeout: expect.any(Number),
      })
    );
  });

  test('should create CNRS OpenAlex remote', () => {
    // Spoof config
    vi.mocked(appConfig).enrich.sources.openalex.isCNRSGateway = true;

    createOpenAlexRemote();

    expect(CNRSGatewayRemote).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        // Retry delay should be transformed to a number
        retryDelay: expect.any(Number),
        // Timeout should be transformed to a number
        timeout: expect.any(Number),
      })
    );
  });
});
