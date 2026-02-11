import EventEmitter from 'node:events';

type HarvestLockEvents = {
  release: [];
  lock: [];
};

export class HarvestLock {
  private events = new EventEmitter<HarvestLockEvents>();

  constructor(private locked = false) {
    this.events.on('lock', () => {
      this.locked = true;
    });
    this.events.on('release', () => {
      this.locked = false;
    });
  }

  get isLocked(): boolean {
    return this.locked === true;
  }

  release(): void {
    if (!this.locked) {
      return;
    }

    this.events.emit('release');
  }

  lock(): void {
    if (this.locked) {
      return;
    }

    this.events.emit('lock');
  }

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
