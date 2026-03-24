import { describe, expect, test, vi } from 'vitest';

import type {
  DataHostSupportedRelease,
  UpdateDataHostSupportedRelease,
} from '~/models/data-host/dto';
import {
  deleteReleaseSupportedByDataHost,
  doesDataHostExists,
  upsertReleaseSupportedByDataHost,
} from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../tests/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix: '/data-hosts/:id/supported-releases/:release',
  });
});

describe('PUT /data-hosts/:id/supported-releases/:release', () => {
  const body: UpdateDataHostSupportedRelease = {
    baseUrl: 'https://example-counter-host.localhost',
    params: {},
  };

  const release: DataHostSupportedRelease = {
    dataHostId: 'id',
    release: '5.1',
    createdAt: new Date(),
    updatedAt: null,
    refreshedAt: null,
    ...body,
  };

  test('should return release supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    upsertReleaseSupportedByDataHost.mockResolvedValueOnce(release);

    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
      body,
    });

    const { content } =
      response.json<SuccessResponse<DataHostSupportedRelease>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...release,
      createdAt: release.createdAt.toISOString(),
    });
  });

  test('should update release supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    upsertReleaseSupportedByDataHost.mockResolvedValueOnce(release);

    await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
      body,
    });

    expect(upsertReleaseSupportedByDataHost).toBeCalledTimes(1);
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
      body,
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test('should return BAD_REQUEST if release is invalid', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/foobar',
      body,
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid option: expected one of "5"|"5.1"'
    );
  });

  test('should return BAD_REQUEST if body is invalid', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
      body: [],
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

describe('DELETE /data-hosts/:id/supported-releases/:release', () => {
  test('should return NO_CONTENT', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    deleteReleaseSupportedByDataHost.mockResolvedValueOnce(true);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5',
    });

    expect(response).toHaveProperty('statusCode', 204);
  });

  test('should delete release supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    deleteReleaseSupportedByDataHost.mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5',
    });

    expect(deleteReleaseSupportedByDataHost).toBeCalledTimes(1);
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test('should return BAD_REQUEST if release is invalid', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/barfoo',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid option: expected one of "5"|"5.1"'
    );
  });
});
