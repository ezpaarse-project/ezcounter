import { describe, expect, test, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import type { rabbitmq } from '~/lib/rabbitmq';
import { mockedChannel } from '~/lib/__mocks__/rabbitmq';
import { appConfig } from '~/lib/config';

import { harvestReport } from '~/models/report/harvest';

import { processHarvestQueue } from '.';
import { sendHarvestJobStatusEvent } from './status';

vi.mock(import('node:timers/promises'));
vi.mock(import('~/models/report/harvest'));
vi.mock(import('./status'));

describe('Harvest Process (processHarvestQueue)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): HarvestJobData => ({
    download: {
      cacheKey: '',
      dataHost: {
        auth: {},
        baseUrl: 'https://example.com',
      },
      release: '5.1',
      report: {
        id: '',
        period: { end: '2025-01', start: '2025-12' },
      },
    },
    id: '',
    insert: {
      index: '',
    },
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

  test('should ensure temporary queue', async () => {
    const process = processHarvestQueue('foobar');

    await process.next();

    expect(mockedChannel.queueDeclare).toHaveBeenCalledWith({
      durable: true,
      queue: 'foobar',
    });
  });

  test('should harvest report if message is present', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    expect(harvestReport).toHaveBeenCalled();
  });

  test('should ack message once harvest is complete', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    const msg = getMessage(job);
    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(msg);
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    expect(mockedChannel.basicAck).toHaveBeenCalledWith({
      deliveryTag: msg.deliveryTag,
    });
  });

  test('should nack message if input is invalid', async () => {
    const process = processHarvestQueue('foobar');

    const msg = getMessage('');
    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(msg);
    await process.next();

    expect(mockedChannel.basicNack).toHaveBeenCalledWith({
      deliveryTag: msg.deliveryTag,
      requeue: false,
    });
  });

  test('should requeue job if endpoint is processing', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      processing: true,
      success: false,
    });
    await process.next();

    const newJob = { ...job, try: 1 };
    newJob.download.forceDownload = true;

    expect(mockedChannel.basicPublish).toHaveBeenCalledWith(
      {
        headers: {
          // X-Delay should be in milliseconds and use config (default in tests)
          'x-delay': appConfig.download.processingBackoff.minutes * 60 * 1000,
        },
        routingKey: 'foobar',
      },
      newJob
    );
  });

  test('should requeue job if endpoint is unavailable', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: false,
      unavailable: true,
    });
    await process.next();

    const newJob = { ...job, try: 1 };
    newJob.download.forceDownload = true;

    expect(mockedChannel.basicPublish).toHaveBeenCalledWith(
      {
        headers: {},
        routingKey: 'foobar',
      },
      newJob
    );
  });

  test('should NOT requeue job if try limit is reached', async () => {
    const job = getJob();
    job.try = appConfig.download.maxTries;

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      processing: true,
      success: false,
    });
    await process.next();

    expect(mockedChannel.basicPublish).not.toHaveBeenCalled();
  });

  test('should NOT throw if requeued failed', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: false,
      unavailable: true,
    });
    vi.mocked(mockedChannel).basicPublish.mockRejectedValueOnce(
      new Error('Send error')
    );
    const promise = process.next();

    await expect(promise).resolves.toHaveProperty('done', false);
  });

  test('should delete queue if no more messages are in queue', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.queueDelete).toHaveBeenCalled();
  });

  test('should NOT delete queue if some messages are delayed', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: false,
      unavailable: true,
    });
    await process.next();

    // No messages left in queue - The first one was delayed
    await process.next();

    expect(mockedChannel.queueDelete).not.toHaveBeenCalled();
  });

  test("should throw if queue couldn't be deleted", async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    // No messages left in queue
    vi.mocked(mockedChannel).queueDelete.mockRejectedValueOnce(
      new Error('Failed to delete queue')
    );
    const promise = process.next();

    await expect(promise).rejects.toThrow('Failed to delete queue');
  });

  test('should close channel if no more messages are in queue', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.close).toHaveBeenCalled();
  });

  test('should notify that job is processing', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValue(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    expect(vi.mocked(sendHarvestJobStatusEvent)).toHaveBeenCalledWith({
      id: job.id,
      startedAt: new Date(),
      status: 'processing',
    });
  });

  test('should notify that job is delayed', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      processing: true,
      success: false,
    });
    await process.next();

    expect(vi.mocked(sendHarvestJobStatusEvent)).toHaveBeenCalledWith({
      id: job.id,
      status: 'delayed',
    });
  });
});
