import { describe, expect, it, vi } from 'vitest';

import {
  appService,
  getAllServices,
  getMissingMandatoryServices,
} from '~/lib/heartbeat';

import type { Heartbeat } from '~/models/heartbeat/dto';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/lib/heartbeat'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/health' });
});

const MOCKED_SERVICE: Heartbeat = {
  createdAt: new Date(),
  hostname: 'foobar',
  nextAt: new Date(),
  service: 'dummy',
  updatedAt: new Date(),
};

describe('get /health', () => {
  it('should return information about self', async () => {
    expect.hasAssertions();
    vi.mocked(getAllServices).mockReturnValueOnce([MOCKED_SERVICE]);

    const promise = server.inject({
      method: 'GET',
      url: '/health/',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 200);

    const response = await promise;
    const { content } = response.json<SuccessResponse<unknown>>();

    expect(content).toHaveProperty('current', appService.name);
    expect(content).toHaveProperty('version', appService.version);
    expect(content).toHaveProperty('services');
  });
});

describe('get /health/services', () => {
  it('should return OK', async () => {
    expect.hasAssertions();
    vi.mocked(getAllServices).mockReturnValueOnce([MOCKED_SERVICE]);

    const promise = server.inject({
      method: 'GET',
      url: '/health/services',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 200);
  });

  it('should return information about others', async () => {
    expect.hasAssertions();
    await server.inject({
      method: 'GET',
      url: '/health/services',
    });

    expect(getAllServices).toHaveBeenCalledOnce();
  });
});

describe('get /health/services/:name', () => {
  it('should return OK', async () => {
    expect.hasAssertions();
    vi.mocked(getAllServices).mockReturnValueOnce([MOCKED_SERVICE]);

    const promise = server.inject({
      method: 'GET',
      url: '/health/services/dummy',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 200);
  });

  it("should return NOT_FOUND if service doesn't exists", async () => {
    expect.hasAssertions();
    vi.mocked(getAllServices).mockReturnValueOnce([MOCKED_SERVICE]);

    const response = await server.inject({
      method: 'GET',
      url: '/health/services/foobar',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Service foobar not found');
  });
});

describe('get /health/probes/liveness', () => {
  it('should return OK (204)', async () => {
    expect.hasAssertions();
    const promise = server.inject({
      method: 'GET',
      url: '/health/probes/liveness',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 204);
  });
});

describe('get /health/probes/readiness', () => {
  it('should return OK (204)', async () => {
    expect.hasAssertions();
    vi.mocked(getMissingMandatoryServices).mockReturnValueOnce([]);

    const promise = server.inject({
      method: 'GET',
      url: '/health/probes/readiness',
    });

    await expect(promise).resolves.toHaveProperty('statusCode', 204);
  });

  it('should check if services are missing', async () => {
    expect.hasAssertions();
    vi.mocked(getMissingMandatoryServices).mockReturnValueOnce([]);

    await server.inject({
      method: 'GET',
      url: '/health/probes/readiness',
    });

    expect(getMissingMandatoryServices).toHaveBeenCalledOnce();
  });

  it('should return SERVICE_UNAVAILABLE if some mandatory services are missing', async () => {
    expect.hasAssertions();
    vi.mocked(getMissingMandatoryServices).mockReturnValueOnce([
      'missing-service',
    ]);

    const response = await server.inject({
      method: 'GET',
      url: '/health/probes/readiness',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 503);
    expect(error).toHaveProperty(
      'message',
      'Readiness probe failed: missing mandatory services'
    );
  });
});
