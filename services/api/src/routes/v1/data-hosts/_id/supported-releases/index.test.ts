import { describe, expect, test, vi } from 'vitest';

import type { DataHostSupportedRelease } from '~/models/data-host/types';
import {
  doesDataHostExists,
  findAllReleasesSupportedByDataHost,
} from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../tests/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/data-hosts/:id/supported-releases' });
});

describe('GET /data-hosts/:id/supported-releases', () => {
  test('should return array of releases supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    findAllReleasesSupportedByDataHost.mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id/supported-releases',
    });

    const { content } =
      response.json<SuccessResponse<DataHostSupportedRelease[]>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(findAllReleasesSupportedByDataHost).toBeCalledTimes(1);
    expect(findAllReleasesSupportedByDataHost).toBeCalledWith(':id');
    expect(content).toBeInstanceOf(Array);
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

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
