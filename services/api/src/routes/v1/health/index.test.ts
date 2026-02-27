import { describe, expect, test, beforeEach, vi } from 'vitest';

import {
  getAllServices,
  getMissingMandatoryServices,
  service,
} from '~/lib/__mocks__/heartbeat';

import { createTestServer } from '~/../tests/fastify/v1';
import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';

import router from '.';

vi.mock(import('~/lib/heartbeat'));

let server = await createTestServer(async (fastify) => {
  fastify.register(router);
});

beforeEach(() => {
  // Clear function history
  vi.clearAllMocks();
});

describe('GET /health', () => {
  test('should return information about self', async () => {
    const promise = server.inject({
      method: 'GET',
      url: '/',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 200);

    const response = await promise;
    const { content } = response.json<SuccessResponse<unknown>>();

    expect(content).toHaveProperty('current', service.name);
    expect(content).toHaveProperty('version', service.version);
    expect(content).toHaveProperty('services');
  });
});

describe('GET /health/services', () => {
  test('should return OK', async () => {
    const promise = server.inject({
      method: 'GET',
      url: '/services',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 200);
  });

  test('should return information about others', async () => {
    await server.inject({
      method: 'GET',
      url: '/services',
    });

    expect(getAllServices).toBeCalled();
  });
});

describe('GET /health/services/:name', () => {
  test('should return OK', async () => {
    const promise = server.inject({
      method: 'GET',
      url: '/services/dummy',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 200);
  });

  test('should return information about others', async () => {
    await server.inject({
      method: 'GET',
      url: '/services/dummy',
    });

    expect(getAllServices).toBeCalled();
  });

  test("should return NOT_FOUND if service doesn't exists", async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/services/foobar',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Service foobar not found');
  });
});

describe('GET /health/probes/liveness', () => {
  test('should return OK (204)', async () => {
    const promise = server.inject({
      method: 'GET',
      url: '/probes/liveness',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 204);
  });
});

describe('GET /health/probes/readiness', () => {
  test('should return OK (204)', async () => {
    const promise = server.inject({
      method: 'GET',
      url: '/probes/readiness',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 204);
  });

  test('should check if services are missing', async () => {
    await server.inject({
      method: 'GET',
      url: '/probes/readiness',
    });

    expect(getMissingMandatoryServices).toBeCalled();
  });

  test('should return SERVICE_UNAVAILABLE if some mandatory services are missing', async () => {
    getMissingMandatoryServices.mockReturnValueOnce(['missing-service']);

    const response = await server.inject({
      method: 'GET',
      url: '/probes/readiness',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 503);
    expect(error).toHaveProperty(
      'message',
      'Readiness probe failed: missing mandatory services'
    );
  });
});
