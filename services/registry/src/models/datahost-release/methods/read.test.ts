import { describe, expect, it, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

import {
  countAllDataHostRelease,
  doesDataHostReleaseExists,
  findAllDataHostRelease,
  findOneDataHostRelease,
} from './read';

describe('find all releases supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostRelease.findMany).mockResolvedValueOnce([]);

    await findAllDataHostRelease(
      'id',
      {
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(dbClient.dataHostRelease.findMany).toHaveBeenCalledExactlyOnceWith({
      include: { changes: { orderBy: { createdAt: 'asc' } } },
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
      where: {
        dataHostId: 'id',
      },
    });
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostRelease.findMany).mockResolvedValueOnce([]);

    const promise = findAllDataHostRelease('id', {}, dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('count all releases supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostRelease.count).mockResolvedValueOnce({
      release: 0,
    });

    await countAllDataHostRelease('id', null, dbClient);

    expect(dbClient.dataHostRelease.count).toHaveBeenCalledExactlyOnceWith({
      select: { release: true },
      where: {
        dataHostId: 'id',
      },
    });
  });
});

describe('does Data Host supports release', () => {
  it('should query DB', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostRelease.count).mockResolvedValueOnce({
      release: 1,
    });

    await doesDataHostReleaseExists(
      { dataHostId: 'id', release: '5' },
      dbClient
    );

    expect(dbClient.dataHostRelease.count).toHaveBeenCalledExactlyOnceWith({
      select: { release: true },
      where: { dataHostId: 'id', release: '5' },
    });
  });

  it('should return true if found', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostRelease.count).mockResolvedValueOnce({
      release: 1,
    });

    const promise = doesDataHostReleaseExists(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostRelease.count).mockResolvedValueOnce(0);

    const promise = doesDataHostReleaseExists(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});

describe('find one release supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostRelease.findUniqueOrThrow).mockResolvedValueOnce(
      {
        availableSince: null,
        baseURL: 'https://counter.localhost/r51',
        compliant: false,
        createdAt: new Date(),
        dataHostId: 'id',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        release: '5.1',
        requiredAuth: null,
        supported: false,
        updatedAt: null,
      }
    );

    await findOneDataHostRelease(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    expect(
      dbClient.dataHostRelease.findUniqueOrThrow
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        include: {
          changes: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })
    );
  });
});
