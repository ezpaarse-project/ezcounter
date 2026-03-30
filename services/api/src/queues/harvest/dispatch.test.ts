import { describe, expect, test } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';
import type { rabbitmq } from '@ezcounter/rabbitmq';
import { rabbitmq as mq, sendJSONMessage } from '@ezcounter/rabbitmq/__mocks__';

import {
  ensureDataHostQueues,
  sendDispatchEvent,
  sendHarvestJobsInQueue,
} from './dispatch';

const chan = {} as unknown as rabbitmq.Channel;

describe('Create queues (ensureDataHostQueues)', () => {
  const hosts = ['dummy-counter-datahost.com', 'google.fr'];

  test('should create one queue per host', async () => {
    mq.assertQueue.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    await ensureDataHostQueues(chan, hosts);

    expect(mq.assertQueue).toBeCalledTimes(2);
  });

  test('should return Map', async () => {
    mq.assertQueue.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    const promise = ensureDataHostQueues(chan, hosts);

    await expect(promise).resolves.toBeInstanceOf(Map);
  });

  test('should track queue creation status', async () => {
    // First queue doesn't exists
    mq.assertQueue.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'first.foobar',
    });
    // Second queue does exists
    mq.assertQueue.mockResolvedValueOnce({
      consumerCount: 1,
      messageCount: 15,
      queue: 'second.foobar',
    });

    const result = await ensureDataHostQueues(chan, hosts);

    expect(result.get(hosts[0])).toHaveProperty('created', true);
    expect(result.get(hosts[1])).toHaveProperty('created', false);
  });

  test('should correctly name queues', async () => {
    mq.assertQueue.mockResolvedValueOnce({
      consumerCount: 0,
      messageCount: 0,
      queue: 'foobar',
    });

    const result = await ensureDataHostQueues(chan, hosts);

    expect(result.get(hosts[0])?.name).toMatch(
      /^ezcounter\.harvest:job:[a-z0-9]{16}$/
    );
  });

  test('should not throw but report error', async () => {
    mq.assertQueue.mockRejectedValueOnce(new Error('Creation error'));

    const result = await ensureDataHostQueues(chan, hosts);

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
    sendHarvestJobsInQueue(chan, { created: true, name: 'foobar' }, jobs);

    expect(sendJSONMessage).toBeCalled();
  });

  test('should return id of jobs', () => {
    const result = sendHarvestJobsInQueue(
      chan,
      { created: true, name: 'foobar' },
      jobs
    );

    expect(result).toHaveProperty('0.id', 'abcde');
  });

  test('should not throw but bubble error', () => {
    const error = {
      code: 'app:ERROR',
      message: 'Creation error',
    };

    const result = sendHarvestJobsInQueue(
      chan,
      { created: false, error, name: 'foobar' },
      jobs
    );

    expect(result).toHaveProperty('0.error', error);
  });

  test('should not throw but report error', () => {
    sendJSONMessage.mockImplementationOnce(() => {
      throw new Error('Send error');
    });

    const result = sendHarvestJobsInQueue(
      chan,
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
    await sendDispatchEvent(chan, { created: true, name: 'foobar' });

    expect(sendJSONMessage).toBeCalled();
  });

  test('should NOT send dispatch if queue existed', async () => {
    await sendDispatchEvent(chan, { created: false, name: 'foobar' });

    expect(sendJSONMessage).not.toBeCalled();
  });

  test('should not throw but bubble error', async () => {
    const error = {
      code: 'app:ERROR',
      message: 'Creation error',
    };

    const promise = sendDispatchEvent(chan, {
      created: false,
      error,
      name: 'foobar',
    });

    await expect(promise).resolves.toHaveProperty('error', error);
  });

  test('should not throw but report error', async () => {
    sendJSONMessage.mockImplementationOnce(() => {
      throw new Error('Dispatch error');
    });

    const promise = sendDispatchEvent(chan, { created: true, name: 'foobar' });

    await expect(promise).resolves.toHaveProperty('error', {
      code: 'app:ERROR',
      message: 'Dispatch error',
    });
  });

  test('should delete queue if dispatch failed', async () => {
    sendJSONMessage.mockImplementationOnce(() => {
      throw new Error('Dispatch error');
    });

    await sendDispatchEvent(chan, { created: true, name: 'foobar' });

    expect(mq.deleteQueue).toBeCalledWith({}, 'foobar');
  });
});
