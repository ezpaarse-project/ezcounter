import { describe, expect, test } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { mockedChannel, mockedPublisher } from '~/lib/__mocks__/rabbitmq';

import {
  ensureDataHostQueues,
  sendDispatchEvent,
  sendHarvestJobsInQueue,
} from './dispatch';

describe('Create queues (ensureDataHostQueues)', () => {
  const hosts = ['dummy-counter-datahost.com', 'google.fr'];

  test('should create one queue per host', async () => {
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    await ensureDataHostQueues(mockedChannel, hosts);

    expect(mockedChannel.queueDeclare).toBeCalledTimes(2);
  });

  test('should return Map', async () => {
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    const promise = ensureDataHostQueues(mockedChannel, hosts);

    await expect(promise).resolves.toBeInstanceOf(Map);
  });

  test('should track queue creation status', async () => {
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

  test('should correctly name queues', async () => {
    mockedChannel.queueDeclare.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    const result = await ensureDataHostQueues(mockedChannel, hosts);

    expect(result.get(hosts[0])?.name).toMatch(
      /^ezcounter:harvest\.job:[a-z0-9]{16}$/
    );
  });

  test('should not throw but report error', async () => {
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

describe('Queue harvest jobs (sendHarvestJobsInQueue)', () => {
  const jobs = [{ id: 'abcde' } as HarvestJobData];

  test('should send jobs', () => {
    sendHarvestJobsInQueue({ created: true, name: 'foobar' }, jobs);

    expect(mockedPublisher.send).toBeCalledWith(
      { messageId: jobs[0].id, routingKey: 'foobar' },
      jobs[0]
    );
  });

  test('should return id of jobs', async () => {
    const result = await sendHarvestJobsInQueue(
      { created: true, name: 'foobar' },
      jobs
    );

    expect(result).toHaveProperty('0.id', 'abcde');
  });

  test('should not throw but bubble error', async () => {
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

  test('should not throw but report error', async () => {
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

describe('Queue dispatch (sendDispatchEvent)', () => {
  test('should send dispatch', async () => {
    await sendDispatchEvent(mockedChannel, { created: true, name: 'foobar' });

    expect(mockedPublisher.send).toBeCalled();
  });

  test('should NOT send dispatch if queue existed', async () => {
    await sendDispatchEvent(mockedChannel, { created: false, name: 'foobar' });

    expect(mockedPublisher.send).not.toBeCalled();
  });

  test('should not throw but bubble error', async () => {
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

  test('should not throw but report error', async () => {
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

  test('should delete queue if dispatch failed', async () => {
    mockedPublisher.send.mockRejectedValueOnce(new Error('Send error'));

    await sendDispatchEvent(mockedChannel, { created: true, name: 'foobar' });

    expect(mockedChannel.queueDelete).toBeCalledWith('foobar');
  });
});
