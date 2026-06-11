import { describe, expect, test } from 'vitest';

import { ExtractionLock } from '.';

describe('Harvest Lock', () => {
  test('should update status', () => {
    const lock = new ExtractionLock();

    lock.lock();
    expect(lock.isLocked).toBe(true);

    lock.release();
    expect(lock.isLocked).toBe(false);
  });

  test('should be free by default', () => {
    const lock = new ExtractionLock();

    expect(lock.isLocked).toBe(false);
  });

  test('should be able to change default', () => {
    const lock = new ExtractionLock(true);

    expect(lock.isLocked).toBe(true);
  });

  test('should be able to wait release', async () => {
    const lock = new ExtractionLock(true);

    const promise = lock.waitForRelease();
    lock.release();

    await expect(promise).resolves.toBe(undefined);
  });
});
