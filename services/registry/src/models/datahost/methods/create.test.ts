import { describe, expect, it, vi } from 'vitest';

import type { DataHost, DataHostChange } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { createDataHost, createDataHostChange } from './create';

describe('create Data Host', () => {
  const dataHost: DataHost = {
    createdAt: new Date(),
    id: 'id',
    local: true,
    name: '',
    params: {},
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHost.create).mockResolvedValueOnce(dataHost);

    await createDataHost(
      {
        name: '',
      },
      dbClient
    );

    expect(dbClient.dataHost.create).toHaveBeenCalledOnce();
  });

  it('should return created data host', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHost.create).mockResolvedValueOnce(dataHost);

    const promise = createDataHost(
      {
        id: 'id',
        local: true,
        name: '',
        params: {},
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(dataHost);
  });
});

describe('create Data Host Change', () => {
  const change: DataHostChange = {
    createdAt: new Date(),
    dataHostId: 'id',
    diff: [
      { key: 'name', newValue: { key: 'name', value: '' }, type: 'added' },
    ],
    id: 'change-id',
  };

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostChange.create).mockResolvedValueOnce(change);

    await createDataHostChange(
      {
        dataHostId: 'id',
        diff: [
          { key: 'name', newValue: { key: 'name', value: '' }, type: 'added' },
        ],
      },
      dbClient
    );

    expect(dbClient.dataHostChange.create).toHaveBeenCalledOnce();
  });

  it('should return created change', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostChange.create).mockResolvedValueOnce(change);

    const promise = createDataHostChange(
      {
        dataHostId: 'id',
        diff: [
          { key: 'name', newValue: { key: 'name', value: '' }, type: 'added' },
        ],
        id: 'change-id',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(change);
  });
});
