import { describe, expect, it, vi } from 'vitest';

import type { DataHostRelease } from '~/models/datahost-release/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostReleaseModel binds to a mockDeep instance
import { mockedDataHostReleaseModel } from '~/models/datahost-release/__mocks__';

import type { ErrorResponse } from '~/routes/v1/shared/responses';
import {
  createTestServer,
  deserializeSuccessResponse,
} from '~/../__tests__/fastify/v1';
import { assertDataHostRegistered } from '~/routes/v1/modules/datahosts/utils';
import { HTTPError } from '~/routes/v1/shared/errors';

import { routes } from '.';

vi.mock(import('~/models/datahost'));
vi.mock(import('~/models/datahost-release'));
vi.mock(import('~/routes/v1/modules/datahosts/utils'));

const server = await createTestServer(async (fastify) => {
  await fastify.register(routes, {
    prefix: '/data-hosts/:id/available-releases',
  });
});

describe('get /data-hosts/:id/available-releases', () => {
  const releases: DataHostRelease[] = [
    {
      _appliedChanges: [],
      availableSince: null,
      baseURL: 'https://counter.localhost/',
      compliant: false,
      createdAt: new Date(),
      dataHostId: 'id',
      params: {},
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM',
      release: '5',
      requiredAuth: {},
      supported: true,
      updatedAt: null,
    },
  ];

  it('should return array of available releases', async () => {
    expect.assertions(5);
    vi.mocked(assertDataHostRegistered).mockResolvedValueOnce();
    vi.mocked(mockedDataHostReleaseModel.findAll).mockResolvedValueOnce(
      releases
    );
    vi.mocked(mockedDataHostReleaseModel.countAll).mockResolvedValueOnce(
      releases.length
    );

    const response = await server.inject({
      method: 'GET',
      query: {
        count: '25',
        page: '3',
        sort: 'release',
      },
      url: '/data-hosts/id/available-releases',
    });

    const { content } = deserializeSuccessResponse<DataHostRelease[]>(response);

    expect(response).toHaveProperty('statusCode', 200);
    expect(mockedDataHostReleaseModel.findAll).toHaveBeenCalledExactlyOnceWith(
      'id',
      {
        orderBy: { release: 'asc' },
        skip: 50,
        take: 25,
      }
    );
    expect(mockedDataHostReleaseModel.countAll).toHaveBeenCalledExactlyOnceWith(
      'id',
      null
    );
    expect(content).toBeInstanceOf(Array);
    expect(content).toHaveLength(releases.length);
  });

  it('should return NOT_FOUND if data host does not exist', async () => {
    expect.assertions(2);
    vi.mocked(assertDataHostRegistered).mockRejectedValueOnce(
      new HTTPError(404, 'Data host "id" is not registered')
    );

    const response = await server.inject({
      method: 'GET',
      url: '/data-hosts/id/available-releases',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 404);
    expect(error).toHaveProperty('message', 'Data host "id" is not registered');
  });
});
