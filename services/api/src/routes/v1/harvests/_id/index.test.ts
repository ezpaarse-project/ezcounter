import { describe, expect, test, vi } from 'vitest';

import type { HarvestJob } from '~/models/harvest/dto';
import { findManyHarvestJobById } from '~/models/harvest/__mocks__';

import type { ErrorResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/queues/harvest/request'));
vi.mock(import('~/models/harvest'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/harvests/:id' });
});

describe('GET /harvests/:id', () => {
  test('should return status', async () => {
    findManyHarvestJobById.mockResolvedValueOnce([{} as HarvestJob]);

    await server.inject({
      method: 'GET',
      url: '/harvests/:id',
    });

    expect(findManyHarvestJobById).toHaveBeenCalledExactlyOnceWith([':id']);
  });

  test('should return NOT_FOUND if id is not found', async () => {
    findManyHarvestJobById.mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      url: '/harvests/:id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Harvest job :id not found');
  });
});
