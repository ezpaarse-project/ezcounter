import { describe, expect, it, vi } from 'vitest';

import type { RegistrySyncActivity } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import {
  countAllSyncActivity,
  doesSyncActivityExists,
  findAllSyncActivity,
  findOneSyncActivity,
} from './read';

describe('does sync activity exists', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.registrySyncActivity.count).mockResolvedValueOnce({
      id: 1,
    });

    await doesSyncActivityExists('sync-id', dbClient);

    expect(dbClient.registrySyncActivity.count).toHaveBeenCalledOnce();
  });

  it('should return true if found', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.registrySyncActivity.count).mockResolvedValueOnce({
      id: 1,
    });

    const promise = doesSyncActivityExists('sync-id', dbClient);

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.registrySyncActivity.count).mockResolvedValueOnce({
      id: 0,
    });

    const promise = doesSyncActivityExists('sync-id', dbClient);

    await expect(promise).resolves.toBe(false);
  });
});

describe('find all sync activity', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.registrySyncActivity.findMany).mockResolvedValueOnce([]);

    await findAllSyncActivity(
      {
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(
      dbClient.registrySyncActivity.findMany
    ).toHaveBeenCalledExactlyOnceWith({
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
    });
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.registrySyncActivity.findMany).mockResolvedValueOnce([]);

    const promise = findAllSyncActivity({}, dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('count all sync activity', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.registrySyncActivity.count).mockResolvedValueOnce({
      id: 0,
    });

    await countAllSyncActivity(null, dbClient);

    expect(dbClient.registrySyncActivity.count).toHaveBeenCalledExactlyOnceWith(
      {
        select: { id: true },
      }
    );
  });
});

describe('find one sync activity', () => {
  const activity: RegistrySyncActivity = {
    createdAt: new Date(),
    error: null,
    id: 'sync-id',
    sourceUrl: '',
    startedAt: null,
    status: 'pending',
    took: null,
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(
      dbClient.registrySyncActivity.findUniqueOrThrow
    ).mockResolvedValueOnce(activity);

    await findOneSyncActivity('sync-id', dbClient);

    expect(
      dbClient.registrySyncActivity.findUniqueOrThrow
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        include: {
          hostActions: {
            include: {
              dataHost: true,
            },
          },
        },
      })
    );
  });

  it('should return activity', async () => {
    expect.hasAssertions();
    vi.mocked(
      dbClient.registrySyncActivity.findUniqueOrThrow
    ).mockResolvedValueOnce(activity);

    const promise = findOneSyncActivity('sync-id', dbClient);

    await expect(promise).resolves.toMatchObject(activity);
  });
});
