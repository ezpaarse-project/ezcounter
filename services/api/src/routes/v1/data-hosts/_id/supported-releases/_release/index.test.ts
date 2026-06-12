import { describe, expect, test, vi } from 'vitest';

import type { DataHostAuthCheckResult } from '@ezcounter/dto/data-host';

import type {
  DataHostSupportedRelease,
  UpdateDataHostSupportedRelease,
} from '~/models/data-host/dto';
import {
  deleteReleaseSupportedByDataHost,
  doesDataHostExists,
  doesDataHostSupportsRelease,
  findOneReleaseSupportedByDataHost,
  upsertReleaseSupportedByDataHost,
} from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';
import { checkDataHostAuth } from '~/rpc/data-host/auth/check';

import router from '.';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/rpc/data-host/auth/check'));

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
    createdAt: new Date(),
    dataHostId: 'id',
    release: '5.1',
    updatedAt: null,
    ...body,
  };

  test('should return release supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    upsertReleaseSupportedByDataHost.mockResolvedValueOnce(release);

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
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
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
    });

    expect(upsertReleaseSupportedByDataHost).toHaveBeenCalledOnce();
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
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
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/foobar',
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
      body: [],
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1',
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

    expect(deleteReleaseSupportedByDataHost).toHaveBeenCalledOnce();
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

describe('POST /data-hosts/:id/supported-release/:release/_check-auth', () => {
  test('should return check result', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);

    findOneReleaseSupportedByDataHost.mockResolvedValueOnce({
      baseUrl: 'https://counter.localhost/',
      createdAt: new Date(),
      dataHost: {
        createdAt: new Date(),
        id: ':id',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        updatedAt: null,
      },
      dataHostId: ':id',
      params: {},
      release: '5',
      updatedAt: null,
    });
    vi.mocked(checkDataHostAuth).mockResolvedValueOnce({
      errors: [],
      success: true,
    });

    const response = await server.inject({
      body: {
        dataHost: { auth: {} },
        report: { id: 'pr' },
      },
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5/_check-auth',
    });

    const { content } =
      response.json<SuccessResponse<DataHostAuthCheckResult>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({ errors: [], success: true });
  });

  test('should check credentials', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);

    findOneReleaseSupportedByDataHost.mockResolvedValueOnce({
      baseUrl: 'https://counter.localhost/',
      createdAt: new Date(),
      dataHost: {
        createdAt: new Date(),
        id: ':id',
        params: {
          param0: 'from host',
          param1: 'from host',
          param2: 'from host',
        },
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        updatedAt: null,
      },
      dataHostId: ':id',
      params: { param0: 'from release', param1: 'from release' },
      release: '5',
      updatedAt: null,
    });
    vi.mocked(checkDataHostAuth).mockResolvedValueOnce({
      errors: [],
      success: true,
    });

    await server.inject({
      body: {
        dataHost: { auth: {} },
        report: { id: 'pr', params: { param0: 'from report' } },
      },
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5/_check-auth',
    });

    expect(checkDataHostAuth).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        release: '5',
        report: expect.objectContaining({
          id: 'pr',
          params: {
            param0: 'from report',
            param1: 'from release',
            param2: 'from host',
          },
        }),
      })
    );
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      body: {
        dataHost: { auth: {} },
        report: { id: 'pr', params: {} },
      },
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5/_check-auth',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test('should return NOT_FOUND if release is not supported', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(false);

    const response = await server.inject({
      body: {
        dataHost: { auth: {} },
        report: { id: 'pr', params: {} },
      },
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/_check-auth',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" does not supports "5.1"'
    );
  });

  test('should return BAD_REQUEST if body is invalid', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);

    findOneReleaseSupportedByDataHost.mockResolvedValueOnce({
      baseUrl: 'https://counter.localhost/',
      createdAt: new Date(),
      dataHost: {
        createdAt: new Date(),
        id: ':id',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        updatedAt: null,
      },
      dataHostId: ':id',
      params: {},
      release: '5',
      updatedAt: null,
    });
    vi.mocked(checkDataHostAuth).mockResolvedValueOnce({
      errors: [],
      success: true,
    });

    const response = await server.inject({
      body: {
        report: {},
      },
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5/_check-auth',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid input: expected object, received undefined'
    );
  });
});
