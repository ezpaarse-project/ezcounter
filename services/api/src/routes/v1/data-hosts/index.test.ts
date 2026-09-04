import { describe, expect, it, vi } from 'vitest';

import type { DataHost } from '~/models/data-host/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/data-host/__mocks__';

import type { SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/data-hosts' });
});

describe('get /data-hosts', () => {
  it('should return array of registered data hosts', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.findAll).mockResolvedValueOnce([]);
    vi.mocked(mockedDataHostModel.countAll).mockResolvedValueOnce(0);

    const response = await server.inject({
      method: 'GET',
      query: {
        count: '25',
        includes: ['supportedReleases.supportedReports'],
        page: '3',
        sort: 'id',
        'updatedAt[lte]': '2025-01-01',
      },
      url: '/data-hosts',
    });

    const { content } = response.json<SuccessResponse<DataHost[]>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(mockedDataHostModel.findAll).toHaveBeenCalledExactlyOnceWith({
      includes: ['supportedReleases.supportedReports'],
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
      'updatedAt[lte]': new Date('2025-01-01T00:00:00.000Z'),
    });
    expect(mockedDataHostModel.countAll).toHaveBeenCalledExactlyOnceWith({
      'updatedAt[lte]': new Date('2025-01-01T00:00:00.000Z'),
    });
    expect(content).toBeInstanceOf(Array);
  });
});
