import { ofetch } from 'ofetch';
import { describe, expect, it, vi } from 'vitest';

import { createStore } from '~/lib/store';

import { createOpenAlexRemote, createOpenAlexStore } from '.';
import { CNRSGatewayRemote } from './cnrs-gateway';
import { OpenAlexRemote } from './openalex';

vi.mock(import('./cnrs-gateway'));
vi.mock(import('./openalex'));
vi.mock(import('ofetch'));

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
  it('should create OpenAlex remote', async () => {
    expect.assertions(1);
    vi.mocked(ofetch).mockResolvedValueOnce({ name: 'OpenAlex API' });

    await createOpenAlexRemote();

    expect(OpenAlexRemote).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        // Retry delay should be transformed to a number
        retryDelay: expect.any(Number),
        // Timeout should be transformed to a number
        timeout: expect.any(Number),
      })
    );
  });

  it('should create CNRS OpenAlex remote', async () => {
    expect.assertions(1);
    vi.mocked(ofetch).mockResolvedValueOnce('openalex gateway api service');

    await createOpenAlexRemote();

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
