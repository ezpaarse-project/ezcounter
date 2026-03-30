import { type HarvestJobStep, Prisma } from '@ezcounter/database';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

import type { FailHarvestJob, UpdateHarvestJob } from '../dto/update';
import { HarvestJob } from '../dto';

const JOB_STEPS = ['download', 'extract'] as const as readonly HarvestJobStep[];

const logger = appLogger.child({ model: 'harvest', scope: 'models' });

/**
 * Update one Harvest Job
 *
 * @param item - The data to update in harvest job
 *
 * @returns The full harvest job
 */
export async function updateOneHarvestJob(
  item: UpdateHarvestJob
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
  const completed = input.error ?? JOB_STEPS.every((step) => input[step].done);
  // Calculate time took to harvest
  if (input.startedAt && completed !== false) {
    input.status = input.error ? 'error' : 'done';
    input.took = Date.now() - input.startedAt.getTime();
  }

  // Update status
  const updated = await dbClient.harvestJob.update({
    data: {
      ...input,
      error: input.error ?? Prisma.DbNull,
    },
    where: { id: item.id },
  });

  logger.debug({
    action: 'Updated',
    id: item.id,
    msg: 'Updated harvest',
  });

  return HarvestJob.parse(updated);
}

/**
 * Mark many Harvest Jobs as failed with provided errors
 *
 * @param items - The harvest jobs IDs with error
 */
export async function failManyHarvestJob(
  items: FailHarvestJob[]
): Promise<void> {
  await dbClient.$transaction(
    items.map((item) =>
      dbClient.harvestJob.update({
        data: { error: item.error, status: 'error' },
        where: { id: item.id },
      })
    )
  );

  logger.debug({
    action: 'Updated',
    count: items.length,
    msg: 'Updated multiple harvests',
  });
}
