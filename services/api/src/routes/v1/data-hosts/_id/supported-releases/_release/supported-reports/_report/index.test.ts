import { describe, expect, test, vi } from 'vitest';

import type {
  DataHostSupportedReport,
  InputDataHostSupportedReport,
} from '~/models/data-host/types';
import {
  deleteReportSupportedByDataHost,
  doesDataHostExists,
  doesDataHostSupportsRelease,
  upsertReportSupportedByDataHost,
} from '~/models/data-host/__mocks__';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../tests/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix:
      '/data-hosts/:id/supported-releases/:release/supported-reports/:report',
  });
});

describe('PUT /data-hosts/:id/supported-releases/:release/supported-reports/:report', () => {
  const body: InputDataHostSupportedReport = {
    supportedOverride: null,
    firstMonthAvailableOverride: null,
    lastMonthAvailableOverride: null,
  };

  const report: DataHostSupportedReport = {
    dataHostId: 'id',
    release: '5.1',
    id: 'tr',
    supported: true,
    firstMonthAvailable: '',
    lastMonthAvailable: '',
    createdAt: new Date(),
    updatedAt: null,
    ...body,
  };

  test('should return report supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    upsertReportSupportedByDataHost.mockResolvedValueOnce(report);

    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
      body,
    });

    const { content } =
      response.json<SuccessResponse<DataHostSupportedReport>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...report,
      createdAt: report.createdAt.toISOString(),
    });
  });

  test('should update report supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    upsertReportSupportedByDataHost.mockResolvedValueOnce(report);

    await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
      body,
    });

    expect(upsertReportSupportedByDataHost).toBeCalledTimes(1);
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
      body,
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test("should return NOT_FOUND if data host doesn't supports release", async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
      body,
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" does not supports "5.1"'
    );
  });

  test('should return BAD_REQUEST if release is invalid', async () => {
    const response = await server.inject({
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/foobar/supported-reports/:report',
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
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
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

describe('DELETE /data-hosts/:id/supported-releases/:release/supported-reports/:report', () => {
  test('should return NO_CONTENT', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    deleteReportSupportedByDataHost.mockResolvedValueOnce(true);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    expect(response).toHaveProperty('statusCode', 204);
  });

  test('should delete release supported by data host', async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(true);
    deleteReportSupportedByDataHost.mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    expect(deleteReportSupportedByDataHost).toBeCalledTimes(1);
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    doesDataHostExists.mockResolvedValueOnce(false);
    doesDataHostSupportsRelease.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test("should return NOT_FOUND if data host doesn't supports release", async () => {
    doesDataHostExists.mockResolvedValueOnce(true);
    doesDataHostSupportsRelease.mockResolvedValueOnce(false);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" does not supports "5.1"'
    );
  });

  test('should return BAD_REQUEST if release is invalid', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/barfoo/supported-reports/:report',
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
