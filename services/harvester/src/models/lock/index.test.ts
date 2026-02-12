import { describe, expect, test } from 'vitest';
import { HarvestLock } from '.';

describe('Harvest Lock', () => {
  test('should update status', () => {
    const lock = new HarvestLock();

    lock.lock();
    expect(lock.isLocked).toBe(true);

    lock.release();
    expect(lock.isLocked).toBe(false);
  });

  test('should be free by default', () => {
    const lock = new HarvestLock();

    expect(lock.isLocked).toBe(false);
  });

  test('should be able to change default', () => {
    const lock = new HarvestLock(true);

    expect(lock.isLocked).toBe(true);
  });

  test('should be able to wait release', async () => {
    const lock = new HarvestLock(true);

    const promise = lock.waitForRelease();
    lock.release();

    await expect(promise).resolves.toBe(undefined);
  });
});
