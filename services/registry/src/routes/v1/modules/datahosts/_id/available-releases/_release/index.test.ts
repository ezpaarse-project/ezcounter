import { describe, expect, it, vi } from 'vitest';

import type {
  CreateDataHostRelease,
  DataHostRelease,
} from '~/models/datahost-release/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostReleaseModel binds to a mockDeep instance
import { mockedDataHostReleaseModel } from '~/models/datahost-release/__mocks__';

import type { ErrorResponse } from '~/routes/v1/shared/responses';
import {
  createTestServer,
  deserializeSuccessResponse,
} from '~/../__tests__/fastify/v1';
import {
  assertDataHostRegistered,
  assertReleaseRegistered,
} from '~/routes/v1/modules/datahosts/utils';
import { HTTPError } from '~/routes/v1/shared/errors';

import { routes } from '.';

vi.mock(import('~/models/datahost'));
vi.mock(import('~/models/datahost-release'));
vi.mock(import('~/routes/v1/modules/datahosts/utils'));

const server = await createTestServer(async (fastify) => {
  await fastify.register(routes, {
    prefix: '/datahosts/:id/available-releases/:release',
  });
});

describe('get /datahosts/:id/available-releases/:release', () => {
  const release: DataHostRelease = {
    _appliedChanges: [],
    availableSince: null,
    baseURL: 'https://counter.localhost/',
    compliant: false,
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM',
    release: '5',
    requiredAuth: {},
    supported: true,
    updatedAt: null,
  };

  it('should return data host release', async () => {
    expect.assertions(2);
    vi.mocked(assertReleaseRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReleaseModel.findOne).mockResolvedValueOnce(
      release
    );

    const response = await server.inject({
      method: 'GET',
      url: '/datahosts/id/available-releases/5',
    });

    const { content } = deserializeSuccessResponse<DataHostRelease>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...release,
      createdAt: release.createdAt.toISOString(),
    });
  });

  it('should return NOT_FOUND if data host release does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertReleaseRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Release "5" is not registered for data host "id"')
    );

    const response = await server.inject({
      method: 'GET',
      url: '/datahosts/id/available-releases/5',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Release "5" is not registered for data host "id"'
    );
  });
});

describe('put /datahosts/:id/available-releases/:release', () => {
  const body: Omit<CreateDataHostRelease, 'dataHostId' | 'release'> = {
    baseURL: 'https://counter.localhost/',
  };

  const release: DataHostRelease = {
    _appliedChanges: [],
    availableSince: null,
    compliant: false,
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM',
    release: '5',
    requiredAuth: {},
    supported: true,
    updatedAt: null,
    ...body,
  };

  it('should create local release', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      false
    );
    vi.mocked(mockedDataHostReleaseModel.createLocal).mockResolvedValueOnce(
      release
    );

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/datahosts/id/available-releases/5',
    });

    expect(response).toHaveProperty('statusCode', 201);
    expect(mockedDataHostReleaseModel.createLocal).toHaveBeenCalledOnce();
  });

  it('should update local release', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostReleaseModel.updateLocal).mockResolvedValueOnce(
      release
    );

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/datahosts/id/available-releases/5',
    });

    deserializeSuccessResponse(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(mockedDataHostReleaseModel.updateLocal).toHaveBeenCalledOnce();
  });

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.assertions(3);

    const response = await server.inject({
      body: [],
      method: 'PUT',
      url: '/datahosts/id/available-releases/5',
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
      url: '/datahosts/id/available-releases/5',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Data host "id" is not registered');
  });
});

describe('delete /datahosts/:id/available-releases/:release', () => {
  it('should delete data host release', async () => {
    expect.assertions(1);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReleaseModel.delete).mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/datahosts/id/available-releases/5',
    });

    expect(mockedDataHostReleaseModel.delete).toHaveBeenCalledExactlyOnceWith({
      dataHostId: 'id',
      release: '5',
    });
  });

  it('should return NOT_FOUND if data host does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Data host "id" is not registered')
    );

    const response = await server.inject({
      method: 'DELETE',
      url: '/datahosts/id/available-releases/5',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Data host "id" is not registered');
  });
});
