import { setTimeout } from 'node:timers/promises';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { HeartbeatConnectedServicePing } from '../types';
import { doPingWithTimeout } from './utils';

describe('Ping with timeout (doPingWithTimeout)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('should execute ping', async () => {
    const ping = vi.fn<HeartbeatConnectedServicePing>().mockResolvedValueOnce({
      hostname: 'foo',
      service: 'bar',
    });

    await doPingWithTimeout(ping, 100);

    expect(ping).toBeCalled();
  });

  test('should throw TimeoutError if timeout is reached', async () => {
    const ping = vi.fn<HeartbeatConnectedServicePing>(async () => {
      await setTimeout(1000);
      return {
        hostname: 'foo',
        service: 'bar',
      };
    });

    const promise = doPingWithTimeout(ping, 100);

    vi.advanceTimersByTime(100);

    await expect(promise).rejects.toThrow('TimeoutError');
  });

  test('should throw if ping fails', async () => {
    const ping = vi
      .fn<HeartbeatConnectedServicePing>()
      .mockRejectedValue(new Error('Failed'));

    const promise = doPingWithTimeout(ping, 100);

    await expect(promise).rejects.toThrow('Failed');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
