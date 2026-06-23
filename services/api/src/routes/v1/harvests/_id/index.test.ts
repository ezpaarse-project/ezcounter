import { describe, expect, it, vi } from 'vitest';

import type { HarvestJob } from '~/models/harvest/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked HarvestJobModel binds to a mockDeep instance
import { mockedHarvestJobModel } from '~/models/harvest/__mocks__';

import type { ErrorResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/queues/harvest/request'));
vi.mock(import('~/models/harvest'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/harvests/:id' });
});

describe('get /harvests/:id', () => {
  it('should return status', async () => {
    expect.hasAssertions();
    vi.mocked(mockedHarvestJobModel.findManyById).mockResolvedValueOnce([
      {} as HarvestJob,
    ]);

    await server.inject({
      method: 'GET',
      url: '/harvests/:id',
    });

    expect(mockedHarvestJobModel.findManyById).toHaveBeenCalledExactlyOnceWith([
      ':id',
    ]);
  });

  it('should return NOT_FOUND if id is not found', async () => {
    expect.hasAssertions();
    vi.mocked(mockedHarvestJobModel.findManyById).mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      url: '/harvests/:id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Harvest job :id not found');
  });
});
