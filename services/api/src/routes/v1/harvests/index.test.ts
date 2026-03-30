import { describe, expect, test, vi } from 'vitest';

import type { HarvestJobStatusEvent } from '@ezcounter/dto/queues';

import type { CreateHarvestRequest } from '~/models/harvest/dto';
import {
  createManyHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
} from '~/models/harvest/__mocks__';
import { prepareHarvestJobs } from '~/models/harvest/__mocks__/prepare';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';
import { queueHarvestJobs } from '~/queues/harvest/__mocks__/dispatch';

import router from '.';

vi.mock(import('~/queues/harvest/dispatch'));
vi.mock(import('~/models/harvest'));
vi.mock(import('~/models/harvest/prepare'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/harvests' });
});

describe('GET /harvests', () => {
  test('should return array of statuses', async () => {
    findAllHarvestJob.mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      url: '/harvests/',
    });

    const { content } =
      response.json<SuccessResponse<HarvestJobStatusEvent[]>>();

    expect(findAllHarvestJob).toHaveBeenCalledOnce();
    expect(content).toBeInstanceOf(Array);
  });
});

describe('POST /harvests/_bulk', () => {
  const body: CreateHarvestRequest[] = [
    {
      download: {
        dataHost: {
          auth: { customer_id: 'foobar' },
          id: 'my-counter-datahost',
        },

        reports: [
          {
            id: 'tr',
            params: { attributes_to_show: ['Access_Method'] },
            period: { end: '2025-12', start: '2025-01' },
            release: '5',
          },
          {
            id: 'pr',
            period: { end: '2025-11', start: '2025-02' },
            release: '5',
          },
        ],
      },
      insert: {
        additionalData: {
          'X-Custom': 'Property',
        },
        index: 'z-example-counter5',
      },
    },
    {
      download: {
        dataHost: {
          auth: { customer_id: 'foobar' },
          id: 'my-counter-datahost',
        },

        reports: [
          {
            id: 'ir',
            period: { end: '2025-12', start: '2025-01' },
            release: '5.1',
            splitPeriodBy: 1,
          },
        ],
      },
      insert: {
        index: 'z-example-counter51',
      },
    },
  ];

  test('should return CREATED', async () => {
    prepareHarvestJobs.mockResolvedValue([]);
    findManyHarvestJobById.mockResolvedValueOnce([]);

    const promise = server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 201);
  });

  test('should return array of statuses', async () => {
    prepareHarvestJobs.mockResolvedValue([]);
    findManyHarvestJobById.mockResolvedValueOnce([]);

    const response = await server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk',
    });

    const { content } =
      response.json<SuccessResponse<HarvestJobStatusEvent[]>>();

    expect(findManyHarvestJobById).toHaveBeenCalledOnce();
    expect(content).toBeInstanceOf(Array);
  });

  test('should transform requests', async () => {
    prepareHarvestJobs.mockResolvedValue([]);
    findManyHarvestJobById.mockResolvedValueOnce([]);

    await server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk',
    });

    expect(prepareHarvestJobs).toBeCalledTimes(body.length);
  });

  test('should create jobs', async () => {
    prepareHarvestJobs.mockResolvedValue([]);
    findManyHarvestJobById.mockResolvedValueOnce([]);

    await server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk',
    });

    expect(createManyHarvestJob).toHaveBeenCalledOnce();
  });

  test('should dispatch jobs', async () => {
    prepareHarvestJobs.mockResolvedValue([]);
    findManyHarvestJobById.mockResolvedValueOnce([]);

    await server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk',
    });

    expect(queueHarvestJobs).toHaveBeenCalledOnce();
  });

  test('should return BAD_REQUEST if body is invalid', async () => {
    const response = await server.inject({
      body: [],
      method: 'POST',
      url: '/harvests/_bulk',
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
