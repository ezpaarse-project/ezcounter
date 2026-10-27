import { describe, expect, it, vi } from 'vitest';

import type { RegistrySyncActivity } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { updateSyncActivity } from './update';

describe('update report of Data Host', () => {
  const activity: RegistrySyncActivity = {
    createdAt: new Date(),
    error: null,
    id: 'sync-id',
    sourceUrl: '',
    startedAt: new Date(),
    status: 'done',
    took: 10,
    updatedAt: new Date(),
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.registrySyncActivity.update).mockResolvedValueOnce(
      activity
    );

    await updateSyncActivity(
      {
        id: 'sync-id',
        status: 'done',
        took: 10,
      },
      dbClient
    );

    expect(dbClient.registrySyncActivity.update).toHaveBeenCalledOnce();
  });

  it('should return updated activity', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.registrySyncActivity.update).mockResolvedValueOnce(
      activity
    );

    const promise = updateSyncActivity(
      {
        id: 'sync-id',
        status: 'done',
        took: 10,
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(activity);
  });
});
