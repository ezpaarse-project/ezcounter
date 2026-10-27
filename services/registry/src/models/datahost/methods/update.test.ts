import { describe, expect, it, vi } from 'vitest';

import type { DataHost } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { unlinkDataHost, updateDataHost } from './update';

describe('update Data Host', () => {
  const dataHost: DataHost = {
    createdAt: new Date(),
    id: 'id',
    local: true,
    name: '',
    params: {},
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.update).mockResolvedValueOnce(dataHost);

    await updateDataHost(
      {
        id: 'id',
        name: '',
      },
      dbClient
    );

    expect(dbClient.dataHost.update).toHaveBeenCalledOnce();
  });

  it('should return updated data host', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.update).mockResolvedValueOnce(dataHost);

    const promise = updateDataHost(
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

describe('make Data Host local', () => {
  const dataHost: DataHost = {
    createdAt: new Date(),
    id: 'new-id',
    local: false,
    name: '',
    params: {},
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.update).mockResolvedValueOnce(dataHost);

    await unlinkDataHost('id', dbClient);

    expect(dbClient.dataHost.update).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: {
          id: expect.toSatisfy((val) => typeof val === 'string'),
          local: true,
        },
      })
    );
  });

  it('should return updated data host with local set to true', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.update).mockResolvedValueOnce(dataHost);

    const promise = unlinkDataHost('id', dbClient);

    await expect(promise).resolves.toMatchObject(dataHost);
  });
});
