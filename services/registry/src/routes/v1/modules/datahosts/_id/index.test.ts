import { describe, expect, it, vi } from 'vitest';

import type { DataHost, UpdateDataHost } from '~/models/datahost/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/datahost/__mocks__';

import type { ErrorResponse } from '~/routes/v1/shared/responses';
import {
  createTestServer,
  deserializeSuccessResponse,
} from '~/../__tests__/fastify/v1';
import { assertDataHostRegistered } from '~/routes/v1/modules/datahosts/utils';
import { HTTPError } from '~/routes/v1/shared/errors';

import { routes } from '.';

vi.mock(import('~/models/datahost'));
vi.mock(import('~/routes/v1/modules/datahosts/utils'));

const server = await createTestServer(async (fastify) => {
  await fastify.register(routes, { prefix: '/datahosts/:id' });
});

describe('get /datahosts/:id', () => {
  const host: DataHost = {
    _appliedChanges: [],
    createdAt: new Date(),
    id: 'id',
    local: true,
    name: 'name',
    params: {},
    updatedAt: null,
  };

  it('should return data host', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostModel.findOne).mockResolvedValueOnce(host);

    const response = await server.inject({
      method: 'GET',
      url: '/datahosts/id',
    });

    const { content } = deserializeSuccessResponse<DataHost>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...host,
      createdAt: host.createdAt.toISOString(),
    });
  });

  it('should return NOT_FOUND if data host does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Data host "id" is not registered')
    );

    const response = await server.inject({
      method: 'GET',
      url: '/datahosts/id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Data host "id" is not registered');
  });
});

describe('put /datahosts/:id', () => {
  const body: Omit<UpdateDataHost, 'id'> = {
    name: 'name',
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
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostModel.updateLocal).mockResolvedValueOnce(host);

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/datahosts/id',
    });

    const { content } = deserializeSuccessResponse<DataHost>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...host,
      createdAt: host.createdAt.toISOString(),
    });
  });

  it('should update data host', async () => {
    expect.assertions(1);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostModel.updateLocal).mockResolvedValueOnce(host);

    await server.inject({
      body,
      method: 'PUT',
      url: '/datahosts/id',
    });

    expect(mockedDataHostModel.updateLocal).toHaveBeenCalledExactlyOnceWith({
      ...body,
      id: 'id',
    });
  });

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.assertions(3);
    const response = await server.inject({
      body: [],
      method: 'PUT',
      url: '/datahosts/:id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid input: expected object, received array'
    );
  });

  it('should return NOT_FOUND if data host does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Data host "id" is not registered')
    );

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/datahosts/id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Data host "id" is not registered');
  });
});

describe('delete /datahosts/:id', () => {
  it('should delete data host', async () => {
    expect.assertions(1);
    vi.mocked(mockedDataHostModel.delete).mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/datahosts/:id',
    });

    expect(mockedDataHostModel.delete).toHaveBeenCalledExactlyOnceWith(':id');
  });
});
