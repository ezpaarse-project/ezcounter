import EventEmitter from 'node:events';

type HarvestLockEvents = {
  release: [];
  lock: [];
};

export class HarvestLock {
  private events = new EventEmitter<HarvestLockEvents>();

  /**
   * In memory lock
   *
   * @param locked - Initial status
   */
  constructor(private locked = false) {
    this.events.on('lock', () => {
      this.locked = true;
    });
    this.events.on('release', () => {
      this.locked = false;
    });
  }

  /**
   * Status of the lock
   */
  get isLocked(): boolean {
    return this.locked === true;
  }

  /**
   * Release lock and notify that lock was release, if not locked do nothing
   */
  release(): void {
    if (!this.locked) {
      return;
    }

    this.events.emit('release');
  }

  /**
   * Lock and notify that lock, if already locked do nothing
   */
  lock(): void {
    if (this.locked) {
      return;
    }

    this.events.emit('lock');
  }

  /**
   * Waits for the next release of the lock, if not locked return immediately
   */
  waitForRelease(): Promise<void> {
    if (!this.locked) {
      return Promise.resolve();
    }

    // oxlint-disable-next-line avoid-new-promises
    return new Promise<void>((resolve) => {
      const handler = (): void => {
        this.events.off('release', handler);
        resolve();
      };
      this.events.on('release', handler);
    });
  }
}
