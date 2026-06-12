import { describe, expect, test, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

import { findAllHarvestJob, findManyHarvestJobById } from './read';

describe(findAllHarvestJob, () => {
  test('should query DB', async () => {
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    await findAllHarvestJob();

    expect(dbClient.harvestJob.findMany).toHaveBeenCalled();
  });

  test('should return array', async () => {
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    const promise = findAllHarvestJob();

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe(findManyHarvestJobById, () => {
  test('should query DB', async () => {
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    await findManyHarvestJobById([]);

    expect(dbClient.harvestJob.findMany).toHaveBeenCalled();
  });

  test('should return array', async () => {
    vi.mocked(dbClient.harvestJob.findMany).mockResolvedValueOnce([]);

    const promise = findManyHarvestJobById([]);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});
