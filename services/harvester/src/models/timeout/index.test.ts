import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { HarvestIdleTimeout } from '.';

describe('Idle Timeout (HarvestIdleTimeout)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('should able to get signal', () => {
    const timeout = new HarvestIdleTimeout();

    expect(timeout.signal).toBeInstanceOf(AbortSignal);
  });

  test('should abort when delay runs out', () => {
    const timeout = new HarvestIdleTimeout();

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(true);
  });

  test('should have explicit reason when aborting', () => {
    const timeout = new HarvestIdleTimeout(5);

    vi.runAllTimers();
    expect(timeout.signal.reason).toBe('Timeout of 5ms exceeded');
  });

  test('should not abort before expected delay', () => {
    const timeout = new HarvestIdleTimeout(5);

    vi.advanceTimersByTime(1);
    expect(timeout.signal.aborted).toBe(false);
  });

  test('should reset time left when tick', () => {
    const timeout = new HarvestIdleTimeout(5);

    // We're before the 5 mark, should not abort
    vi.advanceTimersByTime(3);
    expect(timeout.signal.aborted).toBe(false);
    timeout.tick();

    // We're after the 5 mark, should not abort because we ticked
    vi.advanceTimersByTime(2);
    expect(timeout.signal.aborted).toBe(false);
  });

  test('should not abort after clear', () => {
    const timeout = new HarvestIdleTimeout();
    timeout.clear();

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
