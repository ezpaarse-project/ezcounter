import { describe, expect, it } from 'vitest';

import { ExtractionLock } from '.';

describe('harvest Lock', () => {
  it('should update status', () => {
    expect.hasAssertions();
    const lock = new ExtractionLock();

    lock.lock();
    expect(lock.isLocked).toBe(true);

    lock.release();
    expect(lock.isLocked).toBe(false);
  });

  it('should be free by default', () => {
    expect.hasAssertions();
    const lock = new ExtractionLock();

    expect(lock.isLocked).toBe(false);
  });

  it('should be able to change default', () => {
    expect.hasAssertions();
    const lock = new ExtractionLock(true);

    expect(lock.isLocked).toBe(true);
  });

  it('should be able to wait release', async () => {
    expect.hasAssertions();
    const lock = new ExtractionLock(true);

    const promise = lock.waitForRelease();
    lock.release();

    await expect(promise).resolves.toBeUndefined();
  });
});
