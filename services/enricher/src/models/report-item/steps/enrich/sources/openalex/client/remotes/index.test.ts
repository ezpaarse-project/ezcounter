import { describe, expect, it, vi } from 'vitest';

import { appConfig } from '~/lib/config';
import { createStore } from '~/lib/store';

import { createOpenAlexRemote, createOpenAlexStore } from '.';
import { CNRSGatewayRemote } from './cnrs-gateway';
import { OpenAlexRemote } from './openalex';

vi.mock(import('./cnrs-gateway'));
vi.mock(import('./openalex'));

describe('create store', () => {
  it('should create store', () => {
    expect.hasAssertions();
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

describe('create remote', () => {
  it('should create OpenAlex remote', () => {
    expect.hasAssertions();
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

  it('should create CNRS OpenAlex remote', () => {
    expect.hasAssertions();
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
