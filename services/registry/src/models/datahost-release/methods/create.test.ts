import { describe, expect, it, vi } from 'vitest';

import type {
  DataHostRelease,
  DataHostReleaseChange,
} from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { createDataHostRelease, createDataHostReleaseChange } from './create';

describe('create Release of Data Host', () => {
  const release: DataHostRelease = {
    availableSince: null,
    baseURL: '',
    compliant: false,
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM',
    release: '5.1',
    requiredAuth: {
      api_key: true,
      customer_id: true,
      requestor_id: true,
    },
    supported: true,
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostRelease.create).mockResolvedValueOnce(release);

    await createDataHostRelease(
      {
        baseURL: '',
        dataHostId: 'id',
        release: '5.1',
      },
      dbClient
    );

    expect(dbClient.dataHostRelease.create).toHaveBeenCalledOnce();
  });

  it('should return updated release', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostRelease.create).mockResolvedValueOnce(release);

    const promise = createDataHostRelease(
      {
        availableSince: null,
        baseURL: '',
        compliant: false,
        dataHostId: 'id',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM',
        release: '5.1',
        requiredAuth: {
          api_key: true,
          customer_id: true,
          requestor_id: true,
        },
        supported: true,
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(release);
  });
});

describe('create Release Change of Data Host', () => {
  const change: DataHostReleaseChange = {
    createdAt: new Date(),
    dataHostId: 'id',
    diff: [
      {
        key: 'requiredAuth.api_key',
        newValue: { key: 'requiredAuth.api_key', value: true },
        type: 'added',
      },
    ],
    id: 'change-id',
    release: '5.1',
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReleaseChange.create).mockResolvedValueOnce(
      change
    );

    await createDataHostReleaseChange(
      {
        dataHostId: 'id',
        diff: [
          {
            key: 'requiredAuth.api_key',
            newValue: { key: 'requiredAuth.api_key', value: true },
            type: 'added',
          },
        ],
        release: '5.1',
      },
      dbClient
    );

    expect(dbClient.dataHostReleaseChange.create).toHaveBeenCalledOnce();
  });

  it('should return created change', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReleaseChange.create).mockResolvedValueOnce(
      change
    );

    const promise = createDataHostReleaseChange(
      {
        dataHostId: 'id',
        diff: [
          {
            key: 'requiredAuth.api_key',
            newValue: { key: 'requiredAuth.api_key', value: true },
            type: 'added',
          },
        ],
        id: 'change-id',
        release: '5.1',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(change);
  });
});
