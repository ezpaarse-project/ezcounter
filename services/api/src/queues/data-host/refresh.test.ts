import { describe, expect, test, vi } from 'vitest';

import type { DataHostRefreshData } from '@ezcounter/dto/queues';
import { createFetchError } from '@ezcounter/counter/__mocks__';

import { mockedChannel, type rabbitmq } from '~/lib/__mocks__/rabbitmq';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';
import { getDataHostWithSupportedData } from '~/models/data-host/__mocks__';
import { refreshSupportedReportsOfDataHost } from '~/models/data-host/__mocks__/refresh';

import { processRefreshQueue } from './refresh';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/models/data-host/refresh'));

describe('Data Host Refresh (processRefreshQueue)', () => {
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
  const getMessage = (body: unknown): rabbitmq.SyncMessage => ({
    body,
    deliveryTag: 0,
    exchange: '',
    messageCount: 0,
    redelivered: false,
    routingKey: '',
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

  test('should ensure temporary queue', async () => {
    const process = processRefreshQueue('foobar');

    await process.next();

    expect(mockedChannel.queueDeclare).toBeCalledWith({
      durable: false,
      queue: 'foobar',
    });
  });

  test('should refresh if message is present', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).toBeCalled();
  });

  test('should reject message if invalid', async () => {
    const process = processRefreshQueue('foobar');

    const msg = getMessage('');
    mockedChannel.basicGet.mockResolvedValueOnce(msg);
    await process.next();

    expect(mockedChannel.basicNack).toBeCalledWith({
      deliveryTag: msg.deliveryTag,
      requeue: false,
    });
  });

  test('should NOT refresh if data host is unknown', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(null);
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).not.toBeCalled();
  });

  test('should NOT refresh if release is not supported', async () => {
    const process = processRefreshQueue('foobar');

    const job = getJob();
    job.release = '5';

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
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
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
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
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
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
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    await process.next();

    expect(refreshSupportedReportsOfDataHost).toHaveBeenCalledOnce();
  });

  test('should delete queue if no more messages are in queue', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.queueDelete).toBeCalled();
  });

  test('should close channel if no more messages are in queue', async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.close).toBeCalled();
  });

  test("should throw if queue couldn't be deleted", async () => {
    const process = processRefreshQueue('foobar');

    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(getJob()));
    await process.next();

    // No messages left in queue
    mockedChannel.queueDelete.mockRejectedValueOnce(
      new Error('Failed to delete queue')
    );
    const promise = process.next();

    await expect(promise).rejects.toThrow('Failed to delete queue');
  });
});
