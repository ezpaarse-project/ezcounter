import { describe, expect, it, vi } from 'vitest';

import { IdleTimeoutController } from '.';

describe('idle timeout', () => {
  it('should able to get signal', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();

    expect(timeout.signal).toBeInstanceOf(AbortSignal);
  });

  it('should abort when delay runs out', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(true);
  });

  it('should allow 0ms (no abort)', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController(0);

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(false);
  });

  it('should have explicit reason when aborting', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController(5);

    vi.runAllTimers();
    expect(timeout.signal.reason).toBe('Timeout of 5ms exceeded');
  });

  it('should NOT abort before expected delay', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController(5);

    vi.advanceTimersByTime(2);
    expect(timeout.signal.aborted).toBe(false);
  });

  it('should reset time left when tick', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController(5);

    // We're before the 5 mark, should NOT abort
    vi.advanceTimersByTime(3);
    expect(timeout.signal.aborted).toBe(false);
    timeout.tick();

    // We're after the 5 mark, should NOT abort because we ticked
    vi.advanceTimersByTime(3);
    expect(timeout.signal.aborted).toBe(false);
  });

  it('should NOT abort after clear', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();
    timeout.clear();

    vi.runAllTimers();
    expect(timeout.signal.aborted).toBe(false);
  });

  it('should be able to abort manually', () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();

    timeout.abort();

    expect(timeout.signal.aborted).toBe(true);
  });
});
