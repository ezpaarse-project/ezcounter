import { describe, expect, test, beforeEach, vi } from 'vitest';

import type { HarvestJobStatusEvent } from '@ezcounter/models/queues';

import { queueHarvestJobs } from '~/queues/harvest/__mocks__/dispatch';
import { createManyHarvestJob } from '~/models/harvest/__mocks__';

import type { HarvestRequest } from '~/models/harvest/types';

import { createTestServer } from '~/../tests/fastify/v1';
import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';

import router from '.';

vi.mock(import('~/queues/harvest/dispatch'));
vi.mock(import('~/models/harvest'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router);
});

beforeEach(() => {
  // Clear function history
  vi.clearAllMocks();
});

describe('POST /harvests/_bulk', () => {
  const body: HarvestRequest[] = [
    {
      download: {
        reports: [
          {
            id: 'tr',
            period: { start: '2025-01', end: '2025-12' },
            release: '5',
            params: { attributes_to_show: ['Access_Method'] },
          },
          {
            id: 'pr',
            period: { start: '2025-02', end: '2025-11' },
            release: '5',
          },
        ],

        dataHost: {
          baseUrl: 'https://my-counter-datahost.com/',
          auth: { customer_id: 'foobar' },
        },

        cacheKey: 'counter-datahost',
      },
      insert: {
        index: 'z-example-counter5',
        additionalData: {
          'X-Custom': 'Property',
        },
      },
    },
    {
      download: {
        reports: [
          {
            id: 'ir',
            period: { start: '2025-01', end: '2025-12' },
            splitPeriodBy: 1,
            release: '5.1',
          },
        ],

        dataHost: {
          baseUrl: 'https://my-example-datahost.com/',
          auth: { customer_id: 'foobar' },
          additionalParams: { platform: 'barfoo' },
        },

        cacheKey: 'example-datahost.barfoo',
      },
      insert: {
        index: 'z-example-counter51',
      },
    },
  ];

  test('should return CREATED', async () => {
    const promise = server.inject({
      method: 'POST',
      url: '/_bulk',
      body,
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 201);
  });

  test('should return array of statuses', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/_bulk',
      body,
    });

    const { content } = response.json<SuccessResponse<HarvestJobStatusEvent>>();

    expect(content).toBeInstanceOf(Array);
  });

  test('should create jobs', async () => {
    await server.inject({
      method: 'POST',
      url: '/_bulk',
      body,
    });

    expect(createManyHarvestJob).toBeCalledTimes(1);
  });

  test('should dispatch jobs', async () => {
    await server.inject({
      method: 'POST',
      url: '/_bulk',
      body,
    });

    expect(queueHarvestJobs).toBeCalledTimes(1);
  });

  test('should return BAD_REQUEST if request is invalid', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/_bulk',
      body: [],
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Too small: expected array to have >=1 items'
    );
  });
});
