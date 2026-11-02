import { describe, expect, it, vi } from 'vitest';

import type {
  RegistrySyncActivity,
  RegistrySyncHostAction,
} from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { createSyncActivity, createSyncHostAction } from './create';

describe('create activity for sync', () => {
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
    expect.assertions(1);
    vi.mocked(dbClient.registrySyncActivity.create).mockResolvedValueOnce(
      activity
    );

    await createSyncActivity(
      {
        sourceUrl: '',
        status: 'pending',
      },
      dbClient
    );

    expect(dbClient.registrySyncActivity.create).toHaveBeenCalledOnce();
  });

  it('should return updated report', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.registrySyncActivity.create).mockResolvedValueOnce(
      activity
    );

    const promise = createSyncActivity(
      {
        error: null,
        sourceUrl: '',
        startedAt: null,
        status: 'done',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(activity);
  });
});

describe('create action of sync on host', () => {
  const action: RegistrySyncHostAction = {
    createdAt: new Date(),
    dataHostId: 'id',
    diff: [],
    syncId: 'sync-id',
    type: 'created',
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.registrySyncHostAction.create).mockResolvedValueOnce(
      action
    );

    await createSyncHostAction(
      {
        dataHostId: 'id',
        diff: [],
        syncId: 'sync-id',
        type: 'created',
      },
      dbClient
    );

    expect(dbClient.registrySyncHostAction.create).toHaveBeenCalledOnce();
  });

  it('should return updated activity', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.registrySyncHostAction.create).mockResolvedValueOnce(
      action
    );

    const promise = createSyncHostAction(
      {
        dataHostId: 'id',
        diff: [],
        syncId: 'sync-id',
        type: 'created',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(action);
  });
});
