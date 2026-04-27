import { describe, expect, test, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { appConfig } from '~/lib/__mocks__/config';
import { mockedChannel, type rabbitmq } from '~/lib/__mocks__/rabbitmq';

import { processHarvestQueue } from '.';
import { harvestReport } from '../../../models/report/__mocks__';
import { sendHarvestJobStatusEvent } from './__mocks__/status';

vi.mock(import('node:timers/promises'));
vi.mock(import('~/models/report'));
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
      report: {
        id: '',
        period: { end: '2025-01', start: '2025-12' },
        release: '5.1',
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

    expect(mockedChannel.queueDeclare).toBeCalledWith({
      durable: false,
      queue: 'foobar',
    });
  });

  test('should harvest report if message is present', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    expect(harvestReport).toBeCalled();
  });

  test('should ack message once harvest is complete', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    const msg = getMessage(job);
    mockedChannel.basicGet.mockResolvedValueOnce(msg);
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    expect(mockedChannel.basicAck).toBeCalledWith({
      deliveryTag: msg.deliveryTag,
    });
  });

  test('should nack message if input is invalid', async () => {
    const process = processHarvestQueue('foobar');

    const msg = getMessage('');
    mockedChannel.basicGet.mockResolvedValueOnce(msg);
    await process.next();

    expect(mockedChannel.basicNack).toBeCalledWith({
      deliveryTag: msg.deliveryTag,
      requeue: false,
    });
  });

  test('should requeue job if endpoint is processing', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ processing: true, success: false });
    await process.next();

    const newJob = { ...job, try: 1 };
    newJob.download.forceDownload = true;

    expect(mockedChannel.basicPublish).toBeCalledWith(
      {
        headers: { 'x-delay': appConfig.download.processingBackoff },
        routingKey: 'foobar',
      },
      newJob
    );
  });

  test('should requeue job if endpoint is unavailable', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, unavailable: true });
    await process.next();

    const newJob = { ...job, try: 1 };
    newJob.download.forceDownload = true;

    expect(mockedChannel.basicPublish).toBeCalledWith(
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

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ processing: true, success: false });
    await process.next();

    expect(mockedChannel.basicPublish).not.toBeCalled();
  });

  test('should NOT throw if requeued failed', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, unavailable: true });
    mockedChannel.basicPublish.mockRejectedValueOnce(new Error('Send error'));
    const promise = process.next();

    await expect(promise).resolves.toHaveProperty('done', false);
  });

  test('should delete queue if no more messages are in queue', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.queueDelete).toBeCalled();
  });

  test('should NOT delete queue if some messages are delayed', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, unavailable: true });
    await process.next();

    // No messages left in queue - The first one was delayed
    await process.next();

    expect(mockedChannel.queueDelete).not.toBeCalled();
  });

  test("should throw if queue couldn't be deleted", async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    // No messages left in queue
    mockedChannel.queueDelete.mockRejectedValueOnce(
      new Error('Failed to delete queue')
    );
    const promise = process.next();

    await expect(promise).rejects.toThrow('Failed to delete queue');
  });

  test('should close channel if no more messages are in queue', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.close).toBeCalled();
  });

  test('should notify that job is processing', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValue(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: job.id,
      startedAt: new Date(),
      status: 'processing',
    });
  });

  test('should notify that job is delayed', async () => {
    const job = getJob();

    const process = processHarvestQueue('foobar');

    mockedChannel.basicGet.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ processing: true, success: false });
    await process.next();

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: job.id,
      status: 'delayed',
    });
  });
});
