/**
 * Limits function execution to occur at most once per specified time interval
 *
 * @param fnc - The function
 * @param interval - Min interval between 2 calls
 *
 * @returns The throttled function
 */
export function createThrottledFunction<Args extends unknown[], Return>(
  fnc: (...args: Args) => Return | Promise<Return>,
  interval: number
): (...args: Args) => Promise<Return> {
  let nextArgs: Args | null = null;
  let nextInvocation: Promise<Return> | null = null;
  let delay: Promise<void> | null = null;

  const setupDelay = async (promise: Promise<Return>): Promise<void> => {
    try {
      await promise;
    } catch {
      // We don't need error for delay
    }

    // Not using `node:timers/promise` cause it have issues with Vitest
    // oxlint-disable-next-line promise/avoid-new
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, interval);
    });
  };

  const handler = (): Promise<Return> => {
    if (!nextArgs) {
      return Promise.reject(new Error('args are undefined'));
    }

    nextInvocation = null;

    // Wrapping in a promise to support sync and async functions
    const result = Promise.resolve(fnc(...nextArgs));
    delay = setupDelay(result);

    return result;
  };

  return (...args) => {
    nextArgs = args;

    // oxlint-disable-next-line promise/prefer-await-to-then
    nextInvocation ??= (delay || Promise.resolve()).then(handler);
    return nextInvocation;
  };
}

/**
 * Limits function execution to occur once no longer called
 *
 * @param fnc - The function
 * @param interval - Min interval between 2 calls
 *
 * @returns The throttled function
 */
export function createDebouncedFunction<Args extends unknown[], Return>(
  fnc: (...args: Args) => Return | Promise<Return>,
  interval: number
): (...args: Args) => Promise<Return> {
  let timer: NodeJS.Timeout | null = null;

  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }

    // oxlint-disable-next-line promise/avoid-new
    return new Promise<Return>((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          // Using await to support sync and async functions
          const result = await fnc(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, interval);
    });
  };
}

/**
 * Wait for generator completion, adding a delay between each iteration
 *
 * @param process - The generator to wait for
 * @param delay - The delay between each iteration, disabled if less than 1
 */
export async function waitForGenerator(
  process: Generator | AsyncGenerator,
  delay = 0
): Promise<void> {
  // oxlint-disable no-await-in-loop
  while (true) {
    const { done } = await process.next();
    if (done) {
      break;
    }

    if (delay > 1) {
      // oxlint-disable-next-line promise/avoid-new
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, delay);
      });
    }
  }
  // oxlint-enable no-await-in-loop
}
