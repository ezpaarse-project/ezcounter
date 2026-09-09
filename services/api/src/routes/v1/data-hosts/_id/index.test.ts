import { describe, expect, it, vi } from 'vitest';

import type { DataHost, UpdateDataHost } from '~/models/data-host/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix: '/data-hosts/:id',
  });
});

describe('get /data-hosts/:id', () => {
  const host: DataHost = {
    createdAt: new Date(),
    id: 'id',
    params: {},
    updatedAt: null,
  };

  it('should return data host', async () => {
    expect.assertions(2);
    vi.mocked(mockedDataHostModel.findOne).mockResolvedValueOnce(host);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id',
    });

    const { content } = response.json<SuccessResponse<DataHost>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...host,
      createdAt: host.createdAt.toISOString(),
    });
  });

  it('should resolves includes', async () => {
    expect.assertions(1);
    vi.mocked(mockedDataHostModel.findOne).mockResolvedValueOnce(host);

    await server.inject({
      method: 'GET',
      query: {
        includes: ['supportedReleases.supportedReports'],
      },
      url: '/data-hosts/:id',
    });

    expect(mockedDataHostModel.findOne).toHaveBeenCalledExactlyOnceWith(':id', [
      'supportedReleases.supportedReports',
    ]);
  });
});

describe('put /data-hosts/:id', () => {
  const body: UpdateDataHost = {
    params: {},
  };

  const host: DataHost = {
    createdAt: new Date(),
    id: 'id',
    updatedAt: null,
    ...body,
  };

  it('should return data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.upsert).mockResolvedValueOnce(host);

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id',
    });

    const { content } = response.json<SuccessResponse<DataHost>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...host,
      createdAt: host.createdAt.toISOString(),
    });
  });

  it('should update data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.upsert).mockResolvedValueOnce(host);

    await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id',
    });

    expect(mockedDataHostModel.upsert).toHaveBeenCalledOnce();
  });

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.hasAssertions();
    const response = await server.inject({
      body: [],
      method: 'PUT',
      url: '/data-hosts/:id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid input: expected object, received array'
    );
  });
});

describe('delete /data-hosts/:id', () => {
  it('should return NO_CONTENT', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.delete).mockResolvedValueOnce(true);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id',
    });

    expect(response).toHaveProperty('statusCode', 204);
  });

  it('should delete data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.delete).mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id',
    });

    expect(mockedDataHostModel.delete).toHaveBeenCalledOnce();
  });
});
