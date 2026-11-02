import { describe, expect, it, vi } from 'vitest';

import type { DataHostReport } from '~/models/datahost-report/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostReportModel binds to a mockDeep instance
import { mockedDataHostReportModel } from '~/models/datahost-report/__mocks__';

import type { ErrorResponse } from '~/routes/v1/shared/responses';
import {
  createTestServer,
  deserializeSuccessResponse,
} from '~/../__tests__/fastify/v1';
import { assertReleaseRegistered } from '~/routes/v1/modules/datahosts/utils';
import { HTTPError } from '~/routes/v1/shared/errors';

import { routes } from '.';

vi.mock(import('~/models/datahost-report'));
vi.mock(import('~/routes/v1/modules/datahosts/utils'));

const server = await createTestServer(async (fastify) => {
  await fastify.register(routes, {
    prefix: '/datahosts/:id/available-releases/:release/available-reports',
  });
});

describe('get /datahosts/:id/available-releases/:release/available-reports', () => {
  const reports: DataHostReport[] = [
    {
      _appliedChanges: [],
      createdAt: new Date(),
      dataHostId: 'id',
      firstMonthAvailable: null,
      lastMonthAvailable: null,
      params: {},
      release: '5',
      reportId: 'reportId',
      supported: null,
      updatedAt: null,
    },
  ];

  it('should return array of available reports', async () => {
    expect.assertions(5);
    vi.mocked(assertReleaseRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReportModel.findAll).mockResolvedValueOnce(reports);
    vi.mocked(mockedDataHostReportModel.countAll).mockResolvedValueOnce(
      reports.length
    );

    const response = await server.inject({
      method: 'GET',
      query: {
        count: '25',
        page: '3',
        sort: 'reportId',
      },
      url: '/datahosts/id/available-releases/5/available-reports',
    });

    const { content } = deserializeSuccessResponse<DataHostReport[]>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(mockedDataHostReportModel.findAll).toHaveBeenCalledExactlyOnceWith(
      { dataHostId: 'id', release: '5' },
      {
        orderBy: { reportId: 'asc' },
        skip: 50,
        take: 25,
      }
    );
    expect(mockedDataHostReportModel.countAll).toHaveBeenCalledExactlyOnceWith(
      { dataHostId: 'id', release: '5' },
      null
    );
    expect(content).toBeInstanceOf(Array);
    expect(content).toHaveLength(reports.length);
  });

  it('should return NOT_FOUND if data host release does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertReleaseRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Release "5" is not registered for data host "id"')
    );

    const response = await server.inject({
      method: 'GET',
      url: '/datahosts/id/available-releases/5/available-reports',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty(
      'message',
      'Release "5" is not registered for data host "id"'
    );
  });
});
