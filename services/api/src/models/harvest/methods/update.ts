import { HarvestJobStep, Prisma } from '@ezcounter/database';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

import type { FailHarvestJob, UpdateHarvestJob } from '../dto/update';
import { HarvestJob } from '../dto';

const JOB_STEPS = Object.keys(HarvestJobStep) as HarvestJobStep[];

const logger = appLogger.child({ scope: 'models', model: 'harvest' });

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
  items: FailHarvestJob[]
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
