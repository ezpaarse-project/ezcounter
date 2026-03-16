import type { HarvestJobData } from '@ezcounter/models/queues';
import { HarvestJobStep, Prisma } from '@ezcounter/database/types';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

import { HarvestJob, type HarvestError } from './types';

const JOB_STEPS = Object.keys(HarvestJobStep) as HarvestJobStep[];

const logger = appLogger.child({ scope: 'models', model: 'harvest' });

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

/**
 * Create many Harvest Jobs from data that will be passed in queues
 *
 * @param items - The harvest jobs to create
 */
export async function createManyHarvestJob(
  items: HarvestJobData[]
): Promise<void> {
  await dbClient.harvestJob.createMany({
    data: items.map(
      (item): Prisma.HarvestJobCreateManyInput => ({
        id: item.id,
        reportId: item.download.report.id,
        period: item.download.report.period,
        release: item.download.report.release,
        params: item.download.report.params,
        dataHostId: item.download.cacheKey,
        forceDownload: item.download.forceDownload,
        index: item.insert.index,

        status: 'pending',
      })
    ),
  });

  logger.debug({
    action: 'Created',
    msg: 'Created multiple harvests',
    count: items.length,
  });
}

/**
 * Update one Harvest Job
 *
 * @param item - The data to update in harvest job
 *
 * @returns The full harvest job
 */
export async function updateOneHarvestJob(
  item: Partial<HarvestJob> & { id: string }
): Promise<HarvestJob> {
  // Get job
  const job = HarvestJob.parse(
    await dbClient.harvestJob.findUniqueOrThrow({
      where: { id: item.id },
    })
  );

  // Prevent updates to ended jobs
  if (job.status === 'done' || job.status === 'error') {
    throw new Error(`Unable to update a job with status: ${job.status}`);
  }

  const input = { ...job, ...item };
  // Check if have error or every step is completed
  const completed =
    input.error || JOB_STEPS.every((step) => input[step].done === true);
  // Calculate time took to harvest
  if (input.startedAt && completed) {
    input.status = input.error ? 'error' : 'done';
    input.took = Date.now() - input.startedAt.getTime();
  }

  // Update status
  const updated = await dbClient.harvestJob.update({
    where: { id: item.id },
    data: {
      ...input,
      error: input.error || Prisma.DbNull,
    },
  });

  logger.debug({
    action: 'Updated',
    msg: 'Updated harvest',
    id: item.id,
  });

  return HarvestJob.parse(updated);
}

/**
 * Mark many Harvest Jobs as failed with provided errors
 *
 * @param items - The harvest jobs IDs with error
 */
export async function failManyHarvestJob(
  items: { id: string; error: HarvestError }[]
): Promise<void> {
  await dbClient.$transaction(
    items.map((item) =>
      dbClient.harvestJob.update({
        where: { id: item.id },
        data: { status: 'error', error: item.error },
      })
    )
  );

  logger.debug({
    action: 'Updated',
    msg: 'Updated multiple harvests',
    count: items.length,
  });
}
