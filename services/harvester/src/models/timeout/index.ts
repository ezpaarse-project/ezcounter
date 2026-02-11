export class HarvestIdleTimeout {
  private controller = new AbortController();

  private timeoutId: NodeJS.Timeout | undefined;

  /**
   * Setup idle timeout that will send an AbortSignal if `tick` is not called
   * before delay expires
   *
   * @param delay - Time where job is allowed to hang, default to 60secs
   */
  constructor(private delay = 60 * 1000) {
    this.tick();
  }

  /**
   * Signal triggered when timeout is running out
   */
  get signal(): AbortSignal {
    return this.controller.signal;
  }

  /**
   * Indicate no more actions are excepted, preventing errors
   */
  clear(): void {
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  }

  /**
   * Indicate action has been done, resetting time left
   */
  tick(): void {
    this.clear();
    this.timeoutId = setTimeout(() => {
      this.controller.abort(`Timeout of ${this.delay}ms exceeded`);
    }, this.delay);
  }
}
