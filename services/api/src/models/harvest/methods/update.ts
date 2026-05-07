import { Prisma } from '@ezcounter/database';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

import { type FailHarvestJob, HarvestJob, type UpdateHarvestJob } from '../dto';

const JOB_STEPS = ['download', 'enrich', 'extract', 'insert'] as const;

const logger = appLogger.child({ model: 'harvest', scope: 'models' });

/**
 * Shorthand to calc progress of a step
 *
 * @param value - The value
 * @param total - The total
 *
 * @returns The progress of the step
 */
const calcProgress = (value: number, total: number): number =>
  Math.max(0, Math.min(value / total, 1));

/**
 * Compare 2 step status
 *
 * @param source - The original step
 * @param target - The patch to apply
 *
 * @returns The status to apply
 */
function compareStepStatus<
  Step extends { status: 'pending' | 'skipped' | 'processing' | 'done' },
>(source: Step | undefined, target: Step | undefined): Step['status'] {
  // Don't update if no changes
  if (!source || !target) {
    return source?.status ?? target?.status ?? 'pending';
  }
  // Don't update if done
  if (source.status === 'done' || target.status === 'done') {
    return 'done';
  }
  // Don't update if going back
  if (target.status === 'pending') {
    return source.status;
  }
  // Apply update
  return target.status;
}

/**
 * Apply updates to enrich step
 *
 * Is a bit tricky as enrich step is split in many rabbitmq messages
 *
 * @param source - The step present in DB
 * @param target - The update to apply
 * @param totalItems - The number of items, or 0 to skip progress calculation
 *
 * @returns The updated step
 */
function applyEnrichUpdate(
  source: UpdateHarvestJob['enrich'],
  target: UpdateHarvestJob['enrich'],
  totalItems = 0
): UpdateHarvestJob['enrich'] {
  if (!source || !target) {
    return source || target;
  }

  let totalProgress = 0;
  // Merge stats for each enrich source
  const enrichSources = { ...source.sources };
  for (const [key, next] of Object.entries(target.sources ?? {})) {
    const previous = enrichSources[key];

    const items = (previous?.items ?? 0) + (next?.items ?? 0);
    const progress = totalItems > 0 ? calcProgress(items, totalItems) : 0;
    totalProgress += progress;

    enrichSources[key] = {
      items,
      miss: (previous?.miss ?? 0) + (next?.miss ?? 0),
      progress,
      remote: (previous?.remote ?? 0) + (next?.remote ?? 0),
      store: (previous?.store ?? 0) + (next?.store ?? 0),
    };
  }

  return {
    ...source,
    ...target,
    progress: totalProgress / (Object.keys(enrichSources).length || 1),
    sources: enrichSources,
  };
}

/**
 * Apply updates to insert step
 *
 * Is a bit tricky as insert step is split in many rabbitmq messages
 *
 * @param source - The step present in DB
 * @param target - The update to apply
 * @param totalItems - The number of items, or 0 to skip progress calculation
 *
 * @returns The updated step
 */
function applyInsertUpdate(
  source: UpdateHarvestJob['insert'],
  target: UpdateHarvestJob['insert'],
  totalItems = 0
): UpdateHarvestJob['insert'] {
  if (!source || !target) {
    return source || target;
  }

  // Merge covered months
  const coveredMonths = new Set([
    ...(source.coveredMonths ?? []),
    ...(target.coveredMonths ?? []),
  ]);

  const items = (source.items ?? 0) + (target.items ?? 0);

  return {
    ...source,
    ...target,
    coveredMonths: [...coveredMonths].toSorted(),
    created: (source.created ?? 0) + (target.created ?? 0),
    items,
    progress: totalItems > 0 ? calcProgress(items, totalItems) : 0,
    updated: (source.updated ?? 0) + (target.updated ?? 0),
  };
}

/**
 * Apply updates to harvest job
 *
 * @param job - The job to update
 * @param target - The update to apply
 *
 * @returns The updated job
 */
function updateHarvestJobStatuses(job: UpdateHarvestJob): UpdateHarvestJob {
  if (job.enrich?.progress === 1) {
    job.enrich.status = 'done';
  }
  if (job.insert?.progress === 1) {
    job.insert.status = 'done';
  }

  // Check if have error or every step is completed
  const completed =
    job.error ??
    JOB_STEPS.every(
      (step) => job[step]?.status === 'done' || job[step]?.status === 'skipped'
    );
  // Calculate time took to harvest
  if (job.startedAt && completed !== false) {
    job.status = job.error ? 'error' : 'done';
    job.took = Date.now() - job.startedAt.getTime();
  }

  return job;
}

/**
 * Deeply merge updates of a harvest job
 *
 * @param source - The previous value of the harvest job
 * @param target - The patch to apply
 *
 * @returns - The patched harvest job
 */
export function mergeUpdateData(
  source: UpdateHarvestJob,
  target: UpdateHarvestJob
): UpdateHarvestJob {
  const job = { ...source, ...target };

  // Extract is used to get progress of other steps
  if (job.extract) {
    job.extract = {
      ...source.extract,
      ...target.extract,
      status: compareStepStatus(source.extract, target.extract),
    };
  }

  if (job.download) {
    job.download = {
      ...source.download,
      ...target.download,
      status: compareStepStatus(source.download, target.download),
    };
  }
  if (job.enrich) {
    job.enrich = {
      ...applyEnrichUpdate(source.enrich, target.enrich, job.extract?.items),
      status: compareStepStatus(source.enrich, target.enrich),
    };
  }
  if (job.insert) {
    job.insert = {
      ...applyInsertUpdate(source.insert, target.insert, job.extract?.items),
      status: compareStepStatus(source.insert, target.insert),
    };
  }

  return job;
}

/**
 * Update one Harvest Job
 *
 * @param target - The data to update in harvest job
 *
 * @returns The full harvest job
 */
export async function updateOneHarvestJob(
  target: UpdateHarvestJob
): Promise<HarvestJob> {
  // Get job
  const source = HarvestJob.parse(
    await dbClient.harvestJob.findUniqueOrThrow({
      where: { id: target.id },
    })
  );
  // Prevent updates to ended jobs
  if (source.status === 'done' || source.status === 'error') {
    throw new Error(`Unable to update a job with status: ${source.status}`);
  }

  const input = updateHarvestJobStatuses(mergeUpdateData(source, target));

  // Update status
  const job = await dbClient.harvestJob.update({
    data: {
      ...input,
      error: input.error ?? Prisma.DbNull,
    },
    where: { id: target.id },
  });

  logger.trace({
    action: 'Updated',
    id: target.id,
    msg: 'Updated harvest',
  });

  return HarvestJob.parse(job);
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

  logger.trace({
    action: 'Updated',
    count: items.length,
    msg: 'Updated multiple harvests',
  });
}
