import { describe, expect, test, vi } from 'vitest';

import { IdleTimeoutController } from '.';

describe('Idle Timeout (IdleTimeoutController)', () => {
  test('should able to get signal', () => {
    const timeout = new IdleTimeoutController();

    expect(timeout.signal).toBeInstanceOf(AbortSignal);
  });

  test('should abort when delay runs out', () => {
    const timeout = new IdleTimeoutController();

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(true);
  });

  test('should allow 0ms (no abort)', () => {
    const timeout = new IdleTimeoutController(0);

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(false);
  });

  test('should have explicit reason when aborting', () => {
    const timeout = new IdleTimeoutController(5);

    vi.runAllTimers();
    expect(timeout.signal.reason).toBe('Timeout of 5ms exceeded');
  });

  test('should NOT abort before expected delay', () => {
    const timeout = new IdleTimeoutController(5);

    vi.advanceTimersByTime(2);
    expect(timeout.signal.aborted).toBe(false);
  });

  test('should reset time left when tick', () => {
    const timeout = new IdleTimeoutController(5);

    // We're before the 5 mark, should NOT abort
    vi.advanceTimersByTime(3);
    expect(timeout.signal.aborted).toBe(false);
    timeout.tick();

    // We're after the 5 mark, should NOT abort because we ticked
    vi.advanceTimersByTime(3);
    expect(timeout.signal.aborted).toBe(false);
  });

  test('should NOT abort after clear', () => {
    const timeout = new IdleTimeoutController();
    timeout.clear();

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(false);
  });

  test('should be able to abort manually', () => {
    const timeout = new IdleTimeoutController();

    timeout.abort();

    expect(timeout.signal.aborted).toBe(true);
  });
});
