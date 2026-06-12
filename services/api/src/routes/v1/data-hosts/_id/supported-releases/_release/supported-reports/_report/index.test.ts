import { describe, expect, test, vi } from 'vitest';

import type {
  DataHostSupportedReport,
  UpdateDataHostSupportedReport,
} from '~/models/data-host/dto';
import {
  deleteReportSupportedByDataHost,
  doesDataHostExists,
  doesDataHostSupportsRelease,
  upsertReportSupportedByDataHost,
} from '~/models/data-host';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';

import router from '.';

vi.mock(import('~/models/data-host'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix:
      '/data-hosts/:id/supported-releases/:release/supported-reports/:report',
  });
});

describe('PUT /data-hosts/:id/supported-releases/:release/supported-reports/:report', () => {
  const body: UpdateDataHostSupportedReport = {
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    params: {},
    supported: null,
  };

  const report: DataHostSupportedReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    id: 'tr',
    release: '5.1',
    updatedAt: null,
    ...body,
  };

  test('should return report supported by data host', async () => {
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(true);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(true);
    vi.mocked(upsertReportSupportedByDataHost).mockResolvedValueOnce(report);

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
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
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(true);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(true);
    vi.mocked(upsertReportSupportedByDataHost).mockResolvedValueOnce(report);

    await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
    });

    expect(upsertReportSupportedByDataHost).toHaveBeenCalledOnce();
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(false);

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Data host ":id" is not registered'
    );
  });

  test("should return NOT_FOUND if data host doesn't supports release", async () => {
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(true);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(false);

    const response = await server.inject({
      body,
      method: 'PUT',
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
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/foobar/supported-reports/:report',
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
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
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
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(true);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(true);
    vi.mocked(deleteReportSupportedByDataHost).mockResolvedValueOnce(true);

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    expect(response).toHaveProperty('statusCode', 204);
  });

  test('should delete release supported by data host', async () => {
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(true);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(true);
    vi.mocked(deleteReportSupportedByDataHost).mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    expect(deleteReportSupportedByDataHost).toHaveBeenCalledOnce();
  });

  test("should return NOT_FOUND if data host doesn't exists", async () => {
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(false);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(false);

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
    vi.mocked(doesDataHostExists).mockResolvedValueOnce(true);
    vi.mocked(doesDataHostSupportsRelease).mockResolvedValueOnce(false);

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
