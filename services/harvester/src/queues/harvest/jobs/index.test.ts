import { describe, expect, test, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/models/queues';
import type { rabbitmq } from '@ezcounter/rabbitmq';
import { ZodError } from '@ezcounter/models/lib/zod';
import {
  rabbitmq as mq,
  parseJSONMessage,
  sendJSONMessage,
} from '@ezcounter/rabbitmq/__mocks__';

import { config } from '~/lib/__mocks__/config';

import { processHarvestQueue } from '.';
import { harvestReport } from '../../../models/report/__mocks__';
import { sendHarvestJobStatusEvent } from './__mocks__/status';

vi.mock(import('node:timers/promises'));
vi.mock(import('~/models/report'));
vi.mock(import('./status'));

describe('Harvest Process (processHarvestQueue)', () => {
  const channel = {} as unknown as rabbitmq.Channel;

  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): HarvestJobData => ({
    id: '',
    download: {
      report: {
        id: '',
        period: { start: '', end: '' },
        release: '5.1',
      },
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      cacheKey: '',
    },
    insert: {
      index: '',
    },
  });
  // oxlint-disable-next-line consistent-function-scoping
  const getMessage = (data: unknown): rabbitmq.GetMessage => ({
    content: Buffer.from(JSON.stringify(data)),
    fields: {
      deliveryTag: 0,
      redelivered: false,
      exchange: '',
      routingKey: '',
      messageCount: 0,
    },
    properties: {
      contentType: undefined,
      contentEncoding: undefined,
      headers: undefined,
      deliveryMode: undefined,
      priority: undefined,
      correlationId: undefined,
      replyTo: undefined,
      expiration: undefined,
      messageId: undefined,
      timestamp: undefined,
      type: undefined,
      userId: undefined,
      appId: undefined,
      clusterId: undefined,
    },
  });

  test('should ensure temporary queue', async () => {
    const process = processHarvestQueue(channel, 'foobar');

    await process.next();

    expect(mq.assertQueue).toBeCalledWith(channel, 'foobar', {
      durable: false,
    });
  });

  test('should harvest report if message is present', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    expect(harvestReport).toBeCalled();
  });

  test('should ack message once harvest is complete', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    expect(mq.ackMessage).toBeCalled();
  });

  test('should nack message if input is invalid', async () => {
    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(''));
    parseJSONMessage.mockReturnValueOnce({
      raw: '',
      parseError: new ZodError([]),
    });
    await process.next();

    expect(mq.rejectMessage).toBeCalled();
  });

  test('should requeue job if endpoint is processing', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, processing: true });
    await process.next();

    const newJob = { ...job, try: 1 };
    newJob.download.forceDownload = true;

    expect(sendJSONMessage).toBeCalledWith(
      { channel, queue: { name: 'foobar' } },
      newJob,
      {
        headers: { 'x-delay': config.download.processingBackoff },
      }
    );
  });

  test('should requeue job if endpoint is unavailable', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, unavailable: true });
    await process.next();

    const newJob = { ...job, try: 1 };
    newJob.download.forceDownload = true;

    expect(sendJSONMessage).toBeCalledWith(
      { channel, queue: { name: 'foobar' } },
      newJob,
      {
        headers: {},
      }
    );
  });

  test('should NOT requeue job if try limit is reached', async () => {
    const job = getJob();
    job.try = config.download.maxTries;

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, processing: true });
    await process.next();

    expect(sendJSONMessage).not.toBeCalled();
  });

  test('should NOT throw if requeued failed', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, unavailable: true });
    sendJSONMessage.mockImplementationOnce(() => {
      throw new Error('Not Implemented');
    });
    const promise = process.next();

    await expect(promise).resolves.toHaveProperty('done', false);
  });

  test('should delete queue if no more messages are in queue', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mq.deleteQueue).toBeCalled();
  });

  test('should NOT delete queue if some messages are delayed', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, unavailable: true });
    await process.next();

    // No messages left in queue - The first one was delayed
    await process.next();

    expect(mq.deleteQueue).not.toBeCalled();
  });

  test("should throw if queue couldn't be deleted", async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: true });
    await process.next();

    // No messages left in queue
    mq.deleteQueue.mockRejectedValueOnce(new Error('Failed to delete queue'));
    const promise = process.next();

    await expect(promise).rejects.toThrow('Failed to delete queue');
  });

  test('should notify that job is processing', async () => {
    const job = getJob();

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValue(getMessage(job));
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

    const process = processHarvestQueue(channel, 'foobar');

    mq.getMessage.mockResolvedValueOnce(getMessage(job));
    harvestReport.mockResolvedValueOnce({ success: false, processing: true });
    await process.next();

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: job.id,
      status: 'delayed',
    });
  });
});
