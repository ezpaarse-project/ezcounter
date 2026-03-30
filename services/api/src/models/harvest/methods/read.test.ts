import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import { findAllHarvestJob, findManyHarvestJobById } from './read';

describe(findAllHarvestJob, () => {
  test('should query DB', async () => {
    dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

    await findAllHarvestJob();

    expect(dbClient.harvestJob.findMany).toBeCalled();
  });

  test('should return array', async () => {
    dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

    const promise = findAllHarvestJob();

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe(findManyHarvestJobById, () => {
  test('should query DB', async () => {
    dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

    await findManyHarvestJobById([]);

    expect(dbClient.harvestJob.findMany).toBeCalled();
  });

  test('should return array', async () => {
    dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

    const promise = findManyHarvestJobById([]);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});
