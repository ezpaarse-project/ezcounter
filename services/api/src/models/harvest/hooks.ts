import type { HarvestJob as PrismaHarvestJob } from '@ezcounter/database';
import { z } from '@ezcounter/dto';

import { triggerWebhook } from '~/lib/webhooks';

import { type HarvestHooks, HarvestJob, JOB_STEPS } from './dto';

/**
 * Check if object with status (job or step) is ended
 *
 * @param target - The current value
 * @param source - The previous value. If not present: assume that value was changed
 *
 * @returns If value was ended
 */
function hasEnded<WithStatus extends { status: string }>(
  target: WithStatus,
  source?: WithStatus
): boolean {
  if (source && source.status === target.status) {
    return false;
  }
  return ['done', 'error'].includes(target.status);
}

/**
 * Trigger hooks of a harvest job's step
 *
 * @param target - The current value of step
 * @param source - The previous value of step. If not present: assume that step was changed
 * @param hooks - The harvest job's hooks
 */
async function triggerStepHooks<
  Step extends HarvestJob[(typeof JOB_STEPS)[number]],
>(target: Step, source: Step | undefined, hooks: HarvestHooks): Promise<void> {
  // Has step ended
  if (hooks?.onStepEnd && hasEnded(target, source)) {
    await triggerWebhook(hooks.onStepEnd.target, {
      meta: hooks.additionalData,
      step: target,
    });
  }
}

/**
 * Trigger hooks of a harvest job
 *
 * @param job - The current value of job. If invalid: will not trigger any hook
 * @param previous - The previous value of job. If not present or invalid: assume that job was changed
 */
export async function triggerHarvestHooks(
  job: PrismaHarvestJob | HarvestJob,
  previous?: PrismaHarvestJob | HarvestJob
): Promise<void> {
  const target = z.validate(HarvestJob, job) ? job : undefined;
  const source = z.validate(HarvestJob, previous) ? previous : undefined;
  if (!target) {
    return;
  }

  const { hooks } = target;

  // Steps hooks
  await Promise.all(
    JOB_STEPS.map((step) =>
      triggerStepHooks(target[step], source?.[step], hooks)
    )
  );

  // Has job ended
  if (hooks?.onEnd && hasEnded(target, source)) {
    await triggerWebhook(hooks.onEnd.target, {
      job: target,
      meta: hooks.additionalData,
    });
  }
}
