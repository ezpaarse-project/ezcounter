import { describe, expect, it, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

import {
  countAllDataHost,
  doesDataHostExists,
  findAllDataHost,
  findOneDataHost,
  scrollAllDataHosts,
} from './read';

describe('find all Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    vi.mocked(dbClient.dataHost.findMany).mockResolvedValueOnce([]);

    await findAllDataHost(
      {
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(dbClient.dataHost.findMany).toHaveBeenCalledExactlyOnceWith({
      include: { changes: { orderBy: { createdAt: 'asc' } } },
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
    });
    expect(dbClient.dataHost.findMany).toHaveBeenCalledOnce();
  });

  it('should return array', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.findMany).mockResolvedValueOnce([]);

    const promise = findAllDataHost({}, dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('scroll through data hosts', () => {
  it('should yield data hosts in batches', async () => {
    expect.assertions(4);

    // Mock data
    const mockHosts = [
      {
        changes: [],
        createdAt: new Date(),
        id: '1',
        local: true,
        name: 'Host 1',
        params: {},
        updatedAt: null,
      },
      {
        changes: [],
        createdAt: new Date(),
        id: '2',
        local: true,
        name: 'Host 2',
        params: {},
        updatedAt: null,
      },
      {
        changes: [],
        createdAt: new Date(),
        id: '3',
        local: true,
        name: 'Host 3',
        params: {},
        updatedAt: null,
      },
    ];

    // FindMany will return batches of hosts
    vi.mocked(dbClient.dataHost.findMany)
      .mockResolvedValueOnce(mockHosts.slice(0, 2))
      .mockResolvedValueOnce(mockHosts.slice(2))
      .mockResolvedValueOnce([]);

    const generator = scrollAllDataHosts(
      { orderBy: { id: 'asc' }, take: 2 },
      dbClient
    );

    const hosts = await Array.fromAsync(generator);

    expect(hosts).toStrictEqual(mockHosts);
    expect(dbClient.dataHost.findMany).toHaveBeenNthCalledWith(1, {
      include: {
        changes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
      skip: 0,
      take: 2,
    });
    expect(dbClient.dataHost.findMany).toHaveBeenNthCalledWith(2, {
      include: {
        changes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
      skip: 2,
      take: 2,
    });
    expect(dbClient.dataHost.findMany).toHaveBeenNthCalledWith(3, {
      include: {
        changes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
      skip: 4,
      take: 2,
    });
  });

  it('should stop when no more hosts are available', async () => {
    expect.assertions(2);
    vi.mocked(dbClient.dataHost.findMany).mockResolvedValueOnce([]);

    const generator = scrollAllDataHosts({}, dbClient);

    const hosts = await Array.fromAsync(generator);

    expect(hosts).toStrictEqual([]);
    expect(dbClient.dataHost.findMany).toHaveBeenCalledExactlyOnceWith({
      include: {
        changes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: 0,
      take: 10,
    });
  });
});

describe('count all Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({
      id: 0,
    });

    await countAllDataHost(null, dbClient);

    expect(dbClient.dataHost.count).toHaveBeenCalledExactlyOnceWith({
      select: { id: true },
    });
  });
});

describe('does Data Host exists', () => {
  it('should query DB', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({
      id: 5,
    });

    await doesDataHostExists('id', dbClient);

    expect(dbClient.dataHost.count).toHaveBeenCalledOnce();
  });

  it('should return true if found', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({ id: 1 });

    const promise = doesDataHostExists('id', dbClient);

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({ id: 0 });

    const promise = doesDataHostExists('id', dbClient);

    await expect(promise).resolves.toBe(false);
  });
});

describe('find one Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.findUniqueOrThrow).mockResolvedValueOnce({
      createdAt: new Date(),
      id: 'id',
      local: true,
      name: '',
      params: {},
      updatedAt: null,
    });

    await findOneDataHost('id', dbClient);

    expect(dbClient.dataHost.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
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
