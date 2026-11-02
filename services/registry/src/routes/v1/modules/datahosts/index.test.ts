import { describe, expect, it, vi } from 'vitest';

import type { CreateDataHost, DataHost } from '~/models/datahost/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/datahost/__mocks__';

import type { ErrorResponse } from '~/routes/v1/shared/responses';
import {
  createTestServer,
  deserializeSuccessResponse,
} from '~/../__tests__/fastify/v1';

import { routes } from '.';

vi.mock(import('~/models/datahost'));

const server = await createTestServer(async (fastify) => {
  await fastify.register(routes, { prefix: '/datahosts' });
});

describe('get /datahosts', () => {
  it('should return array of registered data hosts', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.findAll).mockResolvedValueOnce([]);
    vi.mocked(mockedDataHostModel.countAll).mockResolvedValueOnce(0);

    const response = await server.inject({
      method: 'GET',
      query: {
        count: '25',
        page: '3',
        sort: 'id',
      },
      url: '/datahosts',
    });

    const { content } = deserializeSuccessResponse<DataHost[]>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(mockedDataHostModel.findAll).toHaveBeenCalledExactlyOnceWith({
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
    });
    expect(mockedDataHostModel.countAll).toHaveBeenCalledExactlyOnceWith(null);
    expect(content).toBeInstanceOf(Array);
  });
});

describe('post /datahosts', () => {
  const body: Omit<CreateDataHost, 'id'> = {
    name: '',
    params: {},
  };

  const host: DataHost = {
    _appliedChanges: [],
    createdAt: new Date(),
    id: 'id',
    local: true,
    params: {},
    updatedAt: null,
    ...body,
  };

  it('should return data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.createLocal).mockResolvedValueOnce(host);

    const response = await server.inject({
      body,
      method: 'POST',
      url: '/datahosts',
    });

    const { content } = deserializeSuccessResponse<DataHost>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...host,
      createdAt: host.createdAt.toISOString(),
    });
  });

  it('should update data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.createLocal).mockResolvedValueOnce(host);

    await server.inject({
      body,
      method: 'POST',
      url: '/datahosts',
    });

    expect(mockedDataHostModel.createLocal).toHaveBeenCalledOnce();
  });

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.hasAssertions();
    const response = await server.inject({
      body: [],
      method: 'POST',
      url: '/datahosts',
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
