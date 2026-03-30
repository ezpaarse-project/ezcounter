import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createThrottledFunction } from './utils';

describe('Throttled Function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  const spy = vi.fn().mockResolvedValue('foobar');

  test('should call original function', async () => {
    const throttled = createThrottledFunction(spy, 500);

    throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toBeCalled();
  });

  test('should bubble async error', async () => {
    const errSpy = vi.fn().mockRejectedValue(new Error('Not Implemented'));

    const throttled = createThrottledFunction(errSpy, 500);

    const promise = throttled();

    await expect(promise).rejects.toThrow('Not Implemented');
  });

  test('should bubble sync error', async () => {
    const errSpy = vi.fn(() => {
      throw new Error('Not Implemented');
    });

    const throttled = createThrottledFunction(errSpy, 500);

    const promise = throttled();

    await expect(promise).rejects.toThrow('Not Implemented');
  });

  test('should call 1 times if not enough time', async () => {
    const throttled = createThrottledFunction(spy, 500);

    throttled();
    throttled();
    throttled();
    throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  test('should call 2 times if enough time', async () => {
    const throttled = createThrottledFunction(spy, 500);

    throttled();
    throttled();
    await vi.runAllTimersAsync();
    throttled();
    throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toBeCalledTimes(2);
  });

  test('should call with last argument', async () => {
    const throttled = createThrottledFunction(spy, 500);

    throttled();
    throttled('f');
    throttled('foo');
    throttled('foobar');

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledWith('foobar');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
