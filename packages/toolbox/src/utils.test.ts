import { describe, expect, it, vi } from 'vitest';

import {
  createDebouncedFunction,
  createThrottledFunction,
  waitForGenerator,
} from './utils';

type ExampleFunction = (param?: string) => Promise<string>;

describe('create a throttled function', () => {
  const spy = vi.fn<ExampleFunction>().mockResolvedValue('foobar');

  it('should call original function', async () => {
    expect.hasAssertions();
    const throttled = createThrottledFunction(spy, 500);

    throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should bubble async error', async () => {
    expect.hasAssertions();
    const errSpy = vi
      .fn<ExampleFunction>()
      .mockRejectedValue(new Error('Not Implemented'));

    const throttled = createThrottledFunction(errSpy, 500);

    const promise = throttled();

    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  it('should bubble sync error', async () => {
    expect.hasAssertions();
    const errSpy = vi.fn<ExampleFunction>(() => {
      throw new Error('Not Implemented');
    });

    const throttled = createThrottledFunction(errSpy, 500);

    const promise = throttled();

    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  it('should call at most 1 times in interval', async () => {
    expect.hasAssertions();
    const throttled = createThrottledFunction(spy, 500);

    throttled();
    throttled();
    throttled();
    throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should call every interval', async () => {
    expect.hasAssertions();
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
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('should call with last argument', async () => {
    expect.hasAssertions();
    const throttled = createThrottledFunction(spy, 500);

    throttled();
    throttled('f');
    throttled('foo');
    throttled('foobar');

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledWith('foobar');
  });

  it('should return same promise if no delay', async () => {
    expect.hasAssertions();
    const throttled = createThrottledFunction(spy, 500);

    const promise1 = throttled();
    const promise2 = throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(promise1).toBe(promise2);
  });
});

describe('create a debounced', () => {
  const spy = vi.fn<ExampleFunction>().mockResolvedValue('foobar');

  it('should call original function', async () => {
    expect.hasAssertions();
    const debounced = createDebouncedFunction(spy, 500);

    debounced();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should bubble async error', async () => {
    expect.hasAssertions();
    const errSpy = vi
      .fn<ExampleFunction>()
      .mockRejectedValue(new Error('Async Not Implemented'));

    const debounced = createDebouncedFunction(errSpy, 500);

    const promise = debounced();

    // Waiting for last call to resolve
    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  it('should bubble sync error', async () => {
    expect.hasAssertions();
    const errSpy = vi.fn<ExampleFunction>(() => {
      throw new Error('Not Implemented');
    });

    const debounced = createDebouncedFunction(errSpy, 500);

    const promise = debounced();

    // Waiting for last call to resolve
    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Not Implemented');
  });

  it('should call after final call', async () => {
    expect.hasAssertions();
    const debounced = createDebouncedFunction(spy, 500);

    debounced();
    debounced();
    debounced();
    debounced();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should NOT call every interval', async () => {
    expect.hasAssertions();
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

  it('should call with last argument', async () => {
    expect.hasAssertions();
    const debounced = createDebouncedFunction(spy, 500);

    debounced();
    debounced('f');
    debounced('foo');
    debounced('foobar');

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(spy).toHaveBeenCalledWith('foobar');
  });

  it('should NOT return same promise if no delay', async () => {
    expect.hasAssertions();
    const throttled = createDebouncedFunction(spy, 500);

    const promise1 = throttled();
    const promise2 = throttled();

    // Waiting for last call to resolve
    await vi.runAllTimersAsync();
    expect(promise1).not.toBe(promise2);
  });
});

describe('wait for generator function', () => {
  // oxlint-disable-next-line consistent-function-scoping
  function* gen(): Generator {
    for (let index = 0; index < 10; index += 1) {
      yield index;
    }
  }

  it('should iterate generator', async () => {
    expect.hasAssertions();
    const process = gen();
    const spy = vi.spyOn(process, 'next');

    await waitForGenerator(process);

    expect(spy).toHaveBeenCalledTimes(11);
  });

  it('should NOT wait between two iterations if no delay', async () => {
    expect.hasAssertions();
    const process = gen();
    const spy = vi.spyOn(process, 'next');

    const promise = waitForGenerator(process);
    await vi.advanceTimersByTimeAsync(100);
    expect(spy).toHaveBeenCalledTimes(11);

    await promise;
  });

  it('should wait between two iterations', async () => {
    expect.hasAssertions();
    const process = gen();
    const spy = vi.spyOn(process, 'next');

    const promise = waitForGenerator(process, 100);
    expect(spy).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(150);
    expect(spy).toHaveBeenCalledTimes(2);

    await vi.runAllTimersAsync();
    await promise;
  });

  it('should bubble error', async () => {
    expect.hasAssertions();
    const process = gen();
    const spy = vi.spyOn(process, 'next');
    spy.mockImplementationOnce(() => {
      throw new Error('Excepted error');
    });

    const promise = waitForGenerator(process);

    await expect(promise).rejects.toThrow('Excepted error');
  });
});
