import { describe, expect, it, vi } from 'vitest';

import type {
  DataHostSupportedReport,
  UpdateDataHostSupportedReport,
} from '~/models/data-host/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/data-host/__mocks__';

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

describe('put /data-hosts/:id/supported-releases/:release/supported-reports/:report', () => {
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

  it('should return report supported by data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostModel.upsertReportSupported).mockResolvedValueOnce(
      report
    );

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

  it('should update report supported by data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostModel.upsertReportSupported).mockResolvedValueOnce(
      report
    );

    await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/:id/supported-releases/5.1/supported-reports/:report',
    });

    expect(mockedDataHostModel.upsertReportSupported).toHaveBeenCalledOnce();
  });

  it("should return NOT_FOUND if data host doesn't exists", async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(false);

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

  it("should return NOT_FOUND if data host doesn't supports release", async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      false
    );

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

  it('should return BAD_REQUEST if release is invalid', async () => {
    expect.hasAssertions();
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

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.hasAssertions();
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

describe('delete /data-hosts/:id/supported-releases/:release/supported-reports/:report', () => {
  it('should return NO_CONTENT', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostModel.deleteReportSupported).mockResolvedValueOnce(
      true
    );

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    expect(response).toHaveProperty('statusCode', 204);
  });

  it('should delete release supported by data host', async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostModel.deleteReportSupported).mockResolvedValueOnce(
      true
    );

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/:id/supported-releases/5/supported-reports/:report',
    });

    expect(mockedDataHostModel.deleteReportSupported).toHaveBeenCalledOnce();
  });

  it("should return NOT_FOUND if data host doesn't exists", async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(false);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      false
    );

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

  it("should return NOT_FOUND if data host doesn't supports release", async () => {
    expect.hasAssertions();
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostModel.doesSupportsRelease).mockResolvedValueOnce(
      false
    );

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

  it('should return BAD_REQUEST if release is invalid', async () => {
    expect.hasAssertions();
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
