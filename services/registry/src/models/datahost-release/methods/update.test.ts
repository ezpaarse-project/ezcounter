import { describe, expect, it, vi } from 'vitest';

import type { DataHostRelease } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { unsupportDataHostRelease, updateDataHostRelease } from './update';

describe('update release of Data Host', () => {
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
    vi.mocked(dbClient.dataHostRelease.update).mockResolvedValueOnce(release);

    await updateDataHostRelease(
      {
        baseURL: '',
        dataHostId: 'id',
        release: '5.1',
      },
      dbClient
    );

    expect(dbClient.dataHostRelease.update).toHaveBeenCalledOnce();
  });

  it('should return updated release', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostRelease.update).mockResolvedValueOnce(release);

    const promise = updateDataHostRelease(
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

describe('unsupport Data Host Release', () => {
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
    vi.mocked(dbClient.dataHostRelease.update).mockResolvedValueOnce(release);

    await unsupportDataHostRelease(
      {
        dataHostId: 'id',
        release: '5.1',
      },
      dbClient
    );

    expect(dbClient.dataHostRelease.update).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: {
          supported: false,
        },
      })
    );
  });

  it('should return updated release with supported set to false', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostRelease.update).mockResolvedValueOnce(release);

    const promise = unsupportDataHostRelease(
      {
        dataHostId: 'id',
        release: '5.1',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(release);
  });
});
