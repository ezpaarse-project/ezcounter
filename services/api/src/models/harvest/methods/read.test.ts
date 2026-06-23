import { describe, expect, it, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

import {
  countAllHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
} from './read';

describe('find all Harvest Job', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    await findAllHarvestJob(
      {
        'createdAt.from': new Date('2025-01-01T00:00:00.000Z'),
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(dbClient.harvestJob.findMany).toHaveBeenCalledExactlyOnceWith({
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
      where: {
        createdAt: {
          gte: new Date('2025-01-01T00:00:00.000Z'),
          lte: undefined,
        },
      },
    });
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    const promise = findAllHarvestJob({}, dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('count all Harvest Job', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.harvestJob.count).mockResolvedValueOnce({ id: 0 });

    await countAllHarvestJob(
      {
        'createdAt.to': new Date('2025-01-01T00:00:00.000Z'),
      },
      dbClient
    );

    expect(dbClient.harvestJob.count).toHaveBeenCalledExactlyOnceWith({
      select: { id: true },
      where: {
        createdAt: {
          gte: undefined,
          lte: new Date('2025-01-01T00:00:00.000Z'),
        },
      },
    });
  });
});

describe('find many Harvest Job by ID', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    await findManyHarvestJobById([], dbClient);

    expect(dbClient.harvestJob.findMany).toHaveBeenCalledOnce();
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    const promise = findManyHarvestJobById([], dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});
