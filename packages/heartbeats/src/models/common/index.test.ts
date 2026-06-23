import { setTimeout } from 'node:timers/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HeartbeatConnectedServicePing } from './dto';
import { doPingWithTimeout } from '.';

describe('execute ping with timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute ping', async () => {
    expect.assertions(1);

    const ping = vi.fn<HeartbeatConnectedServicePing>().mockResolvedValueOnce({
      hostname: 'foo',
      service: 'bar',
    });

    await doPingWithTimeout(ping, 100);

    expect(ping).toHaveBeenCalledOnce();
  });

  it('should throw TimeoutError if timeout is reached', async () => {
    expect.assertions(1);

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

  it('should throw if ping fails', async () => {
    expect.assertions(1);

    const ping = vi
      .fn<HeartbeatConnectedServicePing>()
      .mockRejectedValue(new Error('Failed'));

    const promise = doPingWithTimeout(ping, 100);

    await expect(promise).rejects.toThrow('Failed');
  });
});
