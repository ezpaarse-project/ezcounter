import { describe, expect, it, vi } from 'vitest';

import type { DataHostSupportedRelease } from '~/models/data-host/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/data-hosts/:id/supported-releases' });
});

describe('get /data-hosts/:id/supported-releases', () => {
  it('should return array of releases supported by data host', async () => {
    expect.assertions(4);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(
      mockedDataHostModel.findAllReleasesSupported
    ).mockResolvedValueOnce([]);
    vi.mocked(
      mockedDataHostModel.countAllReleasesSupported
    ).mockResolvedValueOnce(0);

    const response = await server.inject({
      method: 'GET',
      query: {
        count: '25',
        'createdAt[gte]': '2025-01-01',
        page: '3',
        sort: 'release',
      },
      url: '/data-hosts/:id/supported-releases',
    });

    const { content } =
      response.json<SuccessResponse<DataHostSupportedRelease[]>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(
      mockedDataHostModel.findAllReleasesSupported
    ).toHaveBeenCalledExactlyOnceWith(':id', {
      'createdAt[gte]': new Date('2025-01-01T00:00:00.000Z'),
      orderBy: { release: 'asc' },
      skip: 50,
      take: 25,
    });
    expect(
      mockedDataHostModel.countAllReleasesSupported
    ).toHaveBeenCalledExactlyOnceWith(':id', {
      'createdAt[gte]': new Date('2025-01-01T00:00:00.000Z'),
    });
    expect(content).toBeInstanceOf(Array);
  });

  it("should return NOT_FOUND if data host doesn't exists", async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id/supported-releases',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });
});
