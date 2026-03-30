import { describe, expect, test, vi } from 'vitest';

import type { DataHost } from '~/models/data-host/dto';
import { findAllDataHost } from '~/models/data-host/__mocks__';

import type { SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/data-hosts' });
});

describe('GET /data-hosts', () => {
  test('should return array of registered data hosts', async () => {
    findAllDataHost.mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts',
    });

    const { content } = response.json<SuccessResponse<DataHost[]>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(findAllDataHost).toHaveBeenCalledOnce();
    expect(content).toBeInstanceOf(Array);
  });
});
