import { beforeAll, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { DataHostRefreshData } from '@ezcounter/dto/queues';
import type { rabbitmq } from '@ezcounter/rabbitmq';
import { createFetchError } from '@ezcounter/counter/__mocks__';
import { rabbitmq as mq } from '@ezcounter/rabbitmq/__mocks__';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';
import { getDataHostWithSupportedData } from '~/models/data-host/__mocks__';
import { refreshSupportedReportsOfDataHost } from '~/models/data-host/__mocks__/refresh';

import { getDataHostRefreshQueue, processRefreshQueue } from './refresh';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/models/data-host/refresh'));

describe('Data Host Refresh (processRefreshQueue)', () => {
  const channel = mockDeep<rabbitmq.Channel>();

  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): DataHostRefreshData => ({
    dataHost: {
      auths: [{ customer_id: 'foobar' }],
      id: '',
    },
    id: '',
    release: '5.1',
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getMessage = (data: unknown): rabbitmq.GetMessage => ({
    content: Buffer.from(JSON.stringify(data)),
    fields: {
      deliveryTag: 0,
      exchange: '',
      messageCount: 0,
      redelivered: false,
      routingKey: '',
    },
    properties: {
      appId: undefined,
      clusterId: undefined,
      contentEncoding: undefined,
      contentType: undefined,
      correlationId: undefined,
      deliveryMode: undefined,
      expiration: undefined,
      headers: undefined,
      messageId: undefined,
      priority: undefined,
      replyTo: undefined,
      timestamp: undefined,
      type: undefined,
      userId: undefined,
    },
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getDataHost = (): DataHostWithSupportedData => ({
    createdAt: new Date(),
    id: 'my-counter-datahost',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM-dd',
    supportedReleases: [
      {
        baseUrl: '',
        createdAt: new Date(),
        dataHostId: 'my-counter-datahost',
        params: {},
        refreshedAt: null,
        release: '5.1',
        supportedReports: [],
        updatedAt: null,
      },
    ],
    updatedAt: null,
  });

  beforeAll(() => {
    getDataHostRefreshQueue(channel);
  });

  test('should ensure temporary queue', async () => {
    const process = processRefreshQueue('foobar');

    await process.next();

    expect(mq.assertQueue).toBeCalledWith(channel, 'foobar', {
      durable: false,
    });
  });

  test('should refresh if message is present', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).toBeCalled();
  });

  test('should reject message if invalid', async () => {
    const process = processRefreshQueue('foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(''));
    await process.next();

    expect(mq.rejectMessage).toBeCalled();
  });

  test('should NOT refresh if data host is unknown', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(null);
    mq.getMessage.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).not.toBeCalled();
  });

  test('should NOT refresh if release is not supported', async () => {
    const process = processRefreshQueue('foobar');

    const job = getJob();
    job.release = '5';

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).not.toBeCalled();
  });

  test('should try with next auth if fetch fails', async () => {
    const process = processRefreshQueue('foobar');

    const job = getJob();
    job.dataHost.auths.push({});

    refreshSupportedReportsOfDataHost.mockRejectedValueOnce(
      createFetchError('/reports', 500)
    );
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).toHaveBeenCalledTimes(2);
  });

  test('should NOT try with next auth if not a fetch error', async () => {
    const process = processRefreshQueue('foobar');

    const job = getJob();
    job.dataHost.auths.push({});

    refreshSupportedReportsOfDataHost.mockRejectedValueOnce(
      new Error('Unexpected error')
    );
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).toHaveBeenCalledOnce();
  });

  test('should deduplicate auth', async () => {
    const process = processRefreshQueue('foobar');

    const job = getJob();
    job.dataHost.auths.push(job.dataHost.auths[0]);

    refreshSupportedReportsOfDataHost.mockRejectedValueOnce(
      createFetchError('/reports', 403)
    );
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).toHaveBeenCalledOnce();
  });

  test('should delete queue if no more messages are in queue', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mq.deleteQueue).toBeCalled();
  });

  test("should throw if queue couldn't be deleted", async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mq.getMessage.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    // No messages left in queue
    mq.deleteQueue.mockRejectedValueOnce(new Error('Failed to delete queue'));
    const promise = process.next();

    await expect(promise).rejects.toThrow('Failed to delete queue');
  });
});
