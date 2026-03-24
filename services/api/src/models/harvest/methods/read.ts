import { dbClient } from '~/lib/prisma';

import { HarvestJob } from '../dto';

/**
 * Get all harvest jobs with pagination options
 *
 * @returns The harvest jobs
 */
export async function findAllHarvestJob(): Promise<HarvestJob[]> {
  const jobs = await dbClient.harvestJob.findMany({
    orderBy: [{ createdAt: 'desc' }, { startedAt: 'desc' }],
  });

  return jobs.map((job) => HarvestJob.parse(job));
}

/**
 * Get many Harvest Jobs from ids
 *
 * @param ids - The ids of the jobs
 *
 * @returns The jobs
 */
export async function findManyHarvestJobById(
  ids: string[]
): Promise<HarvestJob[]> {
  const jobs = await dbClient.harvestJob.findMany({
    where: {
      id: { in: ids },
    },
  });

  return jobs.map((job) => HarvestJob.parse(job));
}
