import { describe, expect, test, vi } from 'vitest';

import type { DataHost, UpdateDataHost } from '~/models/data-host/dto';
import { deleteDataHost, upsertDataHost } from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix: '/data-hosts/:id',
  });
});

describe('PUT /data-hosts/:id', () => {
  const body: UpdateDataHost = {
    periodFormat: 'yyyy-MM-dd',
    paramsSeparator: '|',
    params: {},
  };

  const host: DataHost = {
    id: 'id',
    createdAt: new Date(),
    updatedAt: null,
    ...body,
  };

  test('should return data host', async () => {
    upsertDataHost.mockResolvedValueOnce(host);

    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id',
      body,
    });

    const { content } = response.json<SuccessResponse<DataHost>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...host,
      createdAt: host.createdAt.toISOString(),
    });
  });

  test('should update data host', async () => {
    upsertDataHost.mockResolvedValueOnce(host);

    await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id',
      body,
    });

    expect(upsertDataHost).toBeCalledTimes(1);
  });

  test('should return BAD_REQUEST if body is invalid', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id',
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

describe('DELETE /data-hosts/:id', () => {
  test('should return NO_CONTENT', async () => {
    deleteDataHost.mockResolvedValueOnce(true);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id',
    });

    expect(response).toHaveProperty('statusCode', 204);
  });

  test('should delete data host', async () => {
    deleteDataHost.mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id',
    });

    expect(deleteDataHost).toBeCalledTimes(1);
  });
});
