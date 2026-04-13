import { describe, expect, test, vi } from 'vitest';

import type { DataHostSupportedReport } from '~/models/data-host/dto';
import {
  doesDataHostExists,
  doesDataHostSupportsRelease,
  findAllReportsSupportedByDataHost,
} from '~/models/data-host/__mocks__';
import { refreshSupportedReportsOfDataHost } from '~/models/data-host/__mocks__/refresh';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/models/data-host/refresh'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix: '/data-hosts/:id/supported-releases/:release/supported-reports',
  });
});

describe('GET /data-hosts/:id/supported-releases/:release/supported-reports', () => {
  test('should return array of reports supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    findAllReportsSupportedByDataHost.mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports',
    });

    const { content } =
      response.json<SuccessResponse<DataHostSupportedReport[]>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(findAllReportsSupportedByDataHost).toHaveBeenCalledOnce();
    expect(findAllReportsSupportedByDataHost).toBeCalledWith(':id', '5.1');
    expect(content).toBeInstanceOf(Array);
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports',
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
      method: 'GET',
      url: '/data-hosts/:id/supported-releases/foobar/supported-reports',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid option: expected one of "5"|"5.1"'
    );
  });

  test("should return NOT_FOUND if data host doesn't supports release", async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" does not supports "5.1"'
    );
  });
});

describe('POST /data-hosts/:id/supported-releases/:release/supported-reports/_refresh', () => {
  const body = {
    auth: {},
  };

  test('should return array of releases supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    refreshSupportedReportsOfDataHost.mockResolvedValueOnce([]);

    const response = await server.inject({
      body,
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/_refresh',
    });

    const { content } =
      response.json<SuccessResponse<DataHostSupportedReport[]>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toBeInstanceOf(Array);
  });

  test('should refresh supported data for the release', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    refreshSupportedReportsOfDataHost.mockResolvedValueOnce([]);

    await server.inject({
      body,
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/_refresh',
    });

    expect(refreshSupportedReportsOfDataHost).toHaveBeenCalledOnce();
  });

  test('should pass options to refresh', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    refreshSupportedReportsOfDataHost.mockResolvedValueOnce([]);

    await server.inject({
      body: {
        ...body,
        dryRun: true,
        forceRefresh: true,
      },
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/_refresh',
    });

    expect(refreshSupportedReportsOfDataHost).toBeCalledWith(
      undefined,
      body.auth,
      {
        dryRun: true,
        forceRefresh: true,
        release: '5.1',
      }
    );
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      body,
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/_refresh',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test('should return BAD_REQUEST if body is invalid', async () => {
    const response = await server.inject({
      body: {},
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/_refresh',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid input: expected object, received undefined'
    );
  });

  test("should return NOT_FOUND if data host doesn't supports release", async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(false);

    const response = await server.inject({
      body,
      method: 'POST',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/_refresh',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" does not supports "5.1"'
    );
  });
});
