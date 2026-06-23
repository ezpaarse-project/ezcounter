import { describe, expect, it } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

// oxlint-disable-next-line vitest/no-mocks-import - We need to get mockedPublisher as pub is not exported
import { mockedChannel, mockedPublisher } from '~/lib/__mocks__/rabbitmq';

import {
  ensureDataHostQueues,
  sendDispatchEvent,
  sendHarvestJobsInQueue,
} from './dispatch';

describe('create queues', () => {
  const hosts = ['dummy-counter-datahost.com', 'google.fr'];

  it('should create one queue per host', async () => {
    expect.hasAssertions();
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    await ensureDataHostQueues(mockedChannel, hosts);

    expect(mockedChannel.queueDeclare).toHaveBeenCalledTimes(2);
  });

  it('should return Map', async () => {
    expect.hasAssertions();
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    const promise = ensureDataHostQueues(mockedChannel, hosts);

    await expect(promise).resolves.toBeInstanceOf(Map);
  });

  it('should track queue creation status', async () => {
    expect.hasAssertions();
    // First queue doesn't exists
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'first.foobar',
    });
    // Second queue does exists
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 1,
      messageCount: 15,
      queue: 'second.foobar',
    });

    const result = await ensureDataHostQueues(mockedChannel, hosts);

    expect(result.get(hosts[0])).toHaveProperty('created', true);
    expect(result.get(hosts[1])).toHaveProperty('created', false);
  });

  it('should correctly name queues', async () => {
    expect.hasAssertions();
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    const result = await ensureDataHostQueues(mockedChannel, hosts);

    expect(result.get(hosts[0])?.name).toMatch(
      /^ezcounter:harvest\.job:[a-z0-9]{16}$/v
    );
  });

  it('should not throw but report error', async () => {
    expect.hasAssertions();
    mockedChannel.queueDeclare.mockRejectedValueOnce(
      new Error('Creation error')
    );

    const result = await ensureDataHostQueues(mockedChannel, hosts);

    const queue = result.get(hosts[0]);
    expect(queue).toHaveProperty('created', false);
    expect(queue).toHaveProperty('error', {
      code: 'app:ERROR',
      message: 'Creation error',
    });
  });
});

describe('queue harvest jobs', () => {
  const jobs = [{ id: 'abcde' } as HarvestJobData];

  it('should send jobs', () => {
    expect.hasAssertions();
    sendHarvestJobsInQueue({ created: true, name: 'foobar' }, jobs);

    expect(mockedPublisher.send).toHaveBeenCalledWith(
      { messageId: jobs[0].id, routingKey: 'foobar' },
      jobs[0]
    );
  });

  it('should return id of jobs', async () => {
    expect.hasAssertions();
    const result = await sendHarvestJobsInQueue(
      { created: true, name: 'foobar' },
      jobs
    );

    expect(result).toHaveProperty('0.id', 'abcde');
  });

  it('should not throw but bubble error', async () => {
    expect.hasAssertions();
    const error = {
      code: 'app:ERROR',
      message: 'Creation error',
    };

    const result = await sendHarvestJobsInQueue(
      { created: false, error, name: 'foobar' },
      jobs
    );

    expect(result).toHaveProperty('0.error', error);
  });

  it('should not throw but report error', async () => {
    expect.hasAssertions();
    mockedPublisher.send.mockRejectedValueOnce(new Error('Send error'));

    const result = await sendHarvestJobsInQueue(
      { created: true, name: 'foobar' },
      jobs
    );

    expect(result).toHaveProperty('0.error', {
      code: 'app:ERROR',
      message: 'Send error',
    });
  });
});

describe('queue dispatch', () => {
  it('should send dispatch', async () => {
    expect.hasAssertions();
    await sendDispatchEvent(mockedChannel, { created: true, name: 'foobar' });

    expect(mockedPublisher.send).toHaveBeenCalledOnce();
  });

  it('should NOT send dispatch if queue existed', async () => {
    expect.hasAssertions();
    await sendDispatchEvent(mockedChannel, { created: false, name: 'foobar' });

    expect(mockedPublisher.send).not.toHaveBeenCalled();
  });

  it('should not throw but bubble error', async () => {
    expect.hasAssertions();
    const error = {
      code: 'app:ERROR',
      message: 'Creation error',
    };

    const promise = sendDispatchEvent(mockedChannel, {
      created: false,
      error,
      name: 'foobar',
    });

    await expect(promise).resolves.toHaveProperty('error', error);
  });

  it('should not throw but report error', async () => {
    expect.hasAssertions();
    mockedPublisher.send.mockRejectedValueOnce(new Error('Dispatch error'));

    const promise = sendDispatchEvent(mockedChannel, {
      created: true,
      name: 'foobar',
    });

    await expect(promise).resolves.toHaveProperty('error', {
      code: 'app:ERROR',
      message: 'Dispatch error',
    });
  });

  it('should delete queue if dispatch failed', async () => {
    expect.hasAssertions();
    mockedPublisher.send.mockRejectedValueOnce(new Error('Send error'));

    await sendDispatchEvent(mockedChannel, { created: true, name: 'foobar' });

    expect(mockedChannel.queueDelete).toHaveBeenCalledWith('foobar');
  });
});
