import { describe, expect, it, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import type { rabbitmq } from '~/lib/rabbitmq';
// oxlint-disable-next-line vitest/no-mocks-import - We need to get mockedChannel as chan is not exported
import { mockedChannel } from '~/lib/__mocks__/rabbitmq';
import { appConfig } from '~/lib/config';

import { harvestReport } from '~/models/report/harvest';

import { processHarvestQueue } from '.';
import { sendHarvestJobStatusEvent } from './status';

vi.mock(import('node:timers/promises'));
vi.mock(import('~/models/report/harvest'));
vi.mock(import('./status'));

describe('harvest Process', () => {
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

  it('should ensure temporary queue', async () => {
    expect.hasAssertions();
    const process = processHarvestQueue('foobar');

    await process.next();

    expect(mockedChannel.queueDeclare).toHaveBeenCalledWith({
      durable: true,
      queue: 'foobar',
    });
  });

  it('should harvest report if message is present', async () => {
    expect.hasAssertions();
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    expect(harvestReport).toHaveBeenCalledOnce();
  });

  it('should ack message once harvest is complete', async () => {
    expect.hasAssertions();
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

  it('should nack message if input is invalid', async () => {
    expect.hasAssertions();
    const process = processHarvestQueue('foobar');

    const msg = getMessage('');
    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(msg);
    await process.next();

    expect(mockedChannel.basicNack).toHaveBeenCalledWith({
      deliveryTag: msg.deliveryTag,
      requeue: false,
    });
  });

  it('should requeue job if endpoint is processing', async () => {
    expect.hasAssertions();
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

  it('should requeue job if endpoint is unavailable', async () => {
    expect.hasAssertions();
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

  it('should NOT requeue job if try limit is reached', async () => {
    expect.hasAssertions();
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

  it('should NOT throw if requeued failed', async () => {
    expect.hasAssertions();
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

  it('should delete queue if no more messages are in queue', async () => {
    expect.hasAssertions();
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.queueDelete).toHaveBeenCalledOnce();
  });

  it('should NOT delete queue if some messages are delayed', async () => {
    expect.hasAssertions();
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

  it("should throw if queue couldn't be deleted", async () => {
    expect.hasAssertions();
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

  it('should close channel if no more messages are in queue', async () => {
    expect.hasAssertions();
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    // No messages left in queue
    await process.next();

    expect(mockedChannel.close).toHaveBeenCalledOnce();
  });

  it('should notify that job is processing', async () => {
    expect.hasAssertions();
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValue(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      success: true,
    });
    await process.next();

    expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
      id: job.id,
      startedAt: new Date(),
      status: 'processing',
    });
  });

  it('should notify that job is delayed', async () => {
    expect.hasAssertions();
    const job = getJob();

    const process = processHarvestQueue('foobar');

    vi.mocked(mockedChannel).basicGet.mockResolvedValueOnce(getMessage(job));
    vi.mocked(harvestReport).mockResolvedValueOnce({
      processing: true,
      success: false,
    });
    await process.next();

    expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
      id: job.id,
      status: 'delayed',
    });
  });
});
