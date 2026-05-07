import { describe, expect, test, vi } from 'vitest';

import {
  createDebouncedFunction,
  createThrottledFunction,
  waitForGenerator,
} from './utils';

describe('Throttled Function', () => {
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

    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  test('should bubble sync error', async () => {
    const errSpy = vi.fn(() => {
      throw new Error('Not Implemented');
    });

    const throttled = createThrottledFunction(errSpy, 500);

    const promise = throttled();

    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  test('should call at most 1 times in interval', async () => {
    const throttled = createThrottledFunction(spy, 500);

    throttled();
    throttled();
    throttled();
    throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  test('should call every interval', async () => {
    const throttled = createThrottledFunction(spy, 500);

    // Should call - First should always call
    throttled();
    // Should not call
    await vi.advanceTimersByTimeAsync(100);
    throttled();
    // Should call
    await vi.advanceTimersByTimeAsync(405);
    throttled();
    // Should not call
    await vi.advanceTimersByTimeAsync(100);
    throttled();
    // Should call
    await vi.advanceTimersByTimeAsync(405);
    throttled();
    // Should call - Last should always call
    await vi.advanceTimersByTimeAsync(100);
    throttled();

    await vi.runAllTimersAsync();
    expect(spy).toBeCalledTimes(4);
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

  test('should return same promise if no delay', async () => {
    const throttled = createThrottledFunction(spy, 500);

    const promise1 = throttled();
    const promise2 = throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(promise1).toBe(promise2);
  });
});

describe('Debounced Function', () => {
  const spy = vi.fn().mockResolvedValue('foobar');

  test('should call original function', async () => {
    const debounced = createDebouncedFunction(spy, 500);

    debounced();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toBeCalled();
  });

  test('should bubble async error', async () => {
    const errSpy = vi
      .fn()
      .mockRejectedValue(new Error('Async Not Implemented'));

    const debounced = createDebouncedFunction(errSpy, 500);

    const promise = debounced();

    // Waiting for last call to resolve
    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  test('should bubble sync error', async () => {
    const errSpy = vi.fn(() => {
      throw new Error('Not Implemented');
    });

    const debounced = createDebouncedFunction(errSpy, 500);

    const promise = debounced();

    // Waiting for last call to resolve
    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  test('should call after final call', async () => {
    const debounced = createDebouncedFunction(spy, 500);

    debounced();
    debounced();
    debounced();
    debounced();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  test('should NOT call every interval', async () => {
    const debounced = createDebouncedFunction(spy, 500);

    // Should not call
    debounced();
    // Should not call
    await vi.advanceTimersByTimeAsync(100);
    debounced();
    // Should not call
    await vi.advanceTimersByTimeAsync(405);
    debounced();
    // Should not call
    await vi.advanceTimersByTimeAsync(100);
    debounced();
    // Should call
    await vi.advanceTimersByTimeAsync(405);
    debounced();

    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  test('should call with last argument', async () => {
    const debounced = createDebouncedFunction(spy, 500);

    debounced();
    debounced('f');
    debounced('foo');
    debounced('foobar');

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledWith('foobar');
  });

  test('should NOT return same promise if no delay', async () => {
    const throttled = createDebouncedFunction(spy, 500);

    const promise1 = throttled();
    const promise2 = throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(promise1).not.toBe(promise2);
  });
});

describe('Wait for generator', () => {
  // oxlint-disable-next-line consistent-function-scoping
  function* gen(): Generator {
    for (let index = 0; index < 10; index += 1) {
      yield index;
    }
  }

  test('should iterate generator', async () => {
    const process = gen();
    const spy = vi.spyOn(process, 'next');

    await waitForGenerator(process);

    expect(spy).toHaveBeenCalled();
  });

  test('should NOT wait between two iterations if no delay', async () => {
    const process = gen();
    const spy = vi.spyOn(process, 'next');

    const promise = waitForGenerator(process);
    await vi.advanceTimersByTimeAsync(100);
    expect(spy).toHaveBeenCalledTimes(11);

    await promise;
  });

  test('should wait between two iterations', async () => {
    const process = gen();
    const spy = vi.spyOn(process, 'next');

    const promise = waitForGenerator(process, 100);
    expect(spy).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(150);
    expect(spy).toHaveBeenCalledTimes(2);

    await vi.runAllTimersAsync();
    await promise;
  });

  test('should bubble error', async () => {
    const process = gen();
    const spy = vi.spyOn(process, 'next');
    spy.mockImplementationOnce(() => {
      throw new Error('Excepted error');
    });

    const promise = waitForGenerator(process);

    await expect(promise).rejects.toThrowError('Excepted error');
  });
});
