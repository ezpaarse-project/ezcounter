import { describe, expect, test, vi } from 'vitest';

import { createThrottledFunction, waitForGenerator } from './utils';

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

  test('should return same promise if no delay', async () => {
    const throttled = createThrottledFunction(spy, 500);

    const promise1 = throttled();
    const promise2 = throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(promise1).toBe(promise2);
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
