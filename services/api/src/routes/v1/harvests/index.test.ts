import { describe, expect, it, vi } from 'vitest';

import type {
  HarvestJobStatusEvent,
  HarvestRequestData,
} from '@ezcounter/dto/queues';

// oxlint-disable-next-line vitest/no-mocks-import - mocked HarvestJobModel binds to a mockDeep instance
import { mockedHarvestJobModel } from '~/models/harvest/__mocks__';

import type {
  ErrorResponse,
  PaginationMeta,
  SuccessResponse,
} from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';
import { queueHarvestRequest } from '~/queues/harvest/request';

import router from '.';

vi.mock(import('~/queues/harvest/request'));
vi.mock(import('~/models/harvest'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, { prefix: '/harvests' });
});

describe('get /harvests', () => {
  it('should return array of harvest jobs', async () => {
    expect.hasAssertions();
    vi.mocked(mockedHarvestJobModel.countAll).mockResolvedValueOnce(0);
    vi.mocked(mockedHarvestJobModel.findAll).mockResolvedValueOnce([]);

    const response = await server.inject({
      method: 'GET',
      query: {
        count: '25',
        page: '3',
        release: '5.1',
        sort: 'id',
      },
      url: '/harvests',
    });

    const { content } =
      response.json<SuccessResponse<HarvestJobStatusEvent[], PaginationMeta>>();

    expect(response).toHaveProperty('statusCode', 200);
    expect(mockedHarvestJobModel.findAll).toHaveBeenCalledExactlyOnceWith({
      orderBy: { id: 'asc' },
      release: '5.1',
      skip: 50,
      take: 25,
    });
    expect(mockedHarvestJobModel.countAll).toHaveBeenCalledExactlyOnceWith({
      release: '5.1',
    });
    expect(content).toBeInstanceOf(Array);
  });
});

describe('post /harvests/_bulk', () => {
  const body: HarvestRequestData = [
    {
      download: {
        dataHost: {
          auth: { customer_id: 'foobar' },
          id: 'my-counter-datahost',
        },
        release: '5',
        reports: [
          {
            id: 'tr',
            params: { attributes_to_show: ['Access_Method'] },
            period: { end: '2025-12', start: '2025-01' },
          },
          {
            id: 'pr',
            period: { end: '2025-11', start: '2025-02' },
          },
        ],
      },
      insert: {
        additionalData: {
          'X-Custom': 'Property',
        },
        index: 'z-example-counter5',
      },
    },
    {
      download: {
        dataHost: {
          auth: { customer_id: 'foobar' },
          id: 'my-counter-datahost',
        },
        release: '5.1',
        reports: [
          {
            id: 'ir',
            period: { end: '2025-12', start: '2025-01' },
            splitPeriodBy: 1,
          },
        ],
      },
      insert: {
        index: 'z-example-counter51',
      },
    },
  ];

  it('should return CREATED with requestId', async () => {
    expect.hasAssertions();
    vi.mocked(queueHarvestRequest).mockResolvedValueOnce('test-request');

    const response = await server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk',
    });

    const { content } = response.json<SuccessResponse<{ requestId: string }>>();

    expect(response).toHaveProperty('statusCode', 201);
    expect(content).toHaveProperty('requestId', 'test-request');
  });

  it('should queue request', async () => {
    expect.hasAssertions();
    vi.mocked(queueHarvestRequest).mockResolvedValueOnce('foobar');

    await server.inject({
      body,
      method: 'POST',
      url: '/harvests/_bulk?requestId=foobar',
    });

    expect(queueHarvestRequest).toHaveBeenCalledExactlyOnceWith(body, 'foobar');
  });

  it('should return BAD_REQUEST if body is invalid', async () => {
    expect.hasAssertions();
    vi.mocked(queueHarvestRequest).mockResolvedValueOnce('test-request');

    const response = await server.inject({
      body: [],
      method: 'POST',
      url: '/harvests/_bulk',
    });

    const { error } = response.json<ErrorResponse>();

    expect(response).toHaveProperty('statusCode', 400);
    expect(error).toHaveProperty('message', "Request doesn't match the schema");
    expect(error).toHaveProperty(
      'cause.issues.0.message',
      'Too small: expected array to have >=1 items'
    );
  });
});
