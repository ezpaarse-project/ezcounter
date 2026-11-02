import { describe, expect, it, vi } from 'vitest';

import type {
  CreateDataHostReport,
  DataHostReport,
} from '~/models/datahost-report/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostReportModel binds to a mockDeep instance
import { mockedDataHostReportModel } from '~/models/datahost-report/__mocks__';

import type { ErrorResponse } from '~/routes/v1/shared/responses';
import {
  createTestServer,
  deserializeSuccessResponse,
} from '~/../__tests__/fastify/v1';
import {
  assertReleaseRegistered,
  assertReportRegistered,
} from '~/routes/v1/modules/datahosts/utils';
import { HTTPError } from '~/routes/v1/shared/errors';

import { routes } from '.';

vi.mock(import('~/models/datahost-report'));
vi.mock(import('~/routes/v1/modules/datahosts/utils'));

const server = await createTestServer(async (fastify) => {
  await fastify.register(routes, {
    prefix:
      '/data-hosts/:id/available-releases/:release/available-reports/:reportId',
  });
});

describe('get /data-hosts/:id/available-releases/:release/available-reports/:reportId', () => {
  const report: DataHostReport = {
    _appliedChanges: [],
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    params: {},
    release: '5',
    reportId: 'report_id',
    supported: null,
    updatedAt: null,
  };

  it('should return data host report', async () => {
    expect.assertions(2);
    vi.mocked(assertReportRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReportModel.findOne).mockResolvedValueOnce(report);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/:id/available-releases/5/available-reports/report_id',
    });

    const { content } = deserializeSuccessResponse<DataHostReport>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(content).toMatchObject({
      ...report,
      createdAt: report.createdAt.toISOString(),
    });
  });

  it('should return NOT_FOUND if data host report does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertReportRegistered).mockRejectedValueOnce(
      new HTTPError(
        404,
        'Report "report_id" is not registered for release "5" of data host "id"'
      )
    );
    vi.mocked(mockedDataHostReportModel.findOne).mockResolvedValueOnce(report);

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Report "report_id" is not registered for release "5" of data host "id"'
    );
  });
});

describe('put /data-hosts/:id/available-releases/:release/available-reports/:reportId', () => {
  const body: Omit<
    CreateDataHostReport,
    'dataHostId' | 'release' | 'reportId'
  > = {
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    supported: null,
  };

  const report: DataHostReport = {
    _appliedChanges: [],
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    release: '5',
    reportId: 'report_id',
    updatedAt: null,
    ...body,
  };

  it('should create data host report', async () => {
    expect.assertions(1);
    vi.mocked(assertReleaseRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReportModel.doesExists).mockResolvedValueOnce(
      false
    );
    vi.mocked(mockedDataHostReportModel.createLocal).mockResolvedValueOnce(
      report
    );

    await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    expect(mockedDataHostReportModel.createLocal).toHaveBeenCalledOnce();
  });

  it('should update data host report', async () => {
    expect.assertions(1);
    vi.mocked(assertReleaseRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReportModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostReportModel.updateLocal).mockResolvedValueOnce(
      report
    );

    await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    expect(mockedDataHostReportModel.updateLocal).toHaveBeenCalledOnce();
  });

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.assertions(3);

    const response = await server.inject({
      body: [],
      method: 'PUT',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Invalid input: expected object, received array'
    );
  });

  it('should return NOT_FOUND if data host release does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertReleaseRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Release "5" is not registered for data host "id"')
    );

    const response = await server.inject({
      body,
      method: 'PUT',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Release "5" is not registered for data host "id"'
    );
  });
});

describe('delete /data-hosts/:id/available-releases/:release/available-reports/:reportId', () => {
  it('should delete data host report', async () => {
    expect.assertions(1);
    vi.mocked(assertReleaseRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReportModel.delete).mockResolvedValueOnce(true);

    await server.inject({
      method: 'DELETE',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    expect(mockedDataHostReportModel.delete).toHaveBeenCalledExactlyOnceWith({
      dataHostId: 'id',
      release: '5',
      reportId: 'report_id',
    });
  });

  it('should return NOT_FOUND if data host release does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertReleaseRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Release "5" is not registered for data host "id"')
    );

    const response = await server.inject({
      method: 'DELETE',
      url: '/data-hosts/id/available-releases/5/available-reports/report_id',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Release "5" is not registered for data host "id"'
    );
  });
});
