import { createThrottledFunction } from '@ezcounter/toolbox/utils';

import { appLogger } from '~/lib/logger';

import type { UpdateHarvestJob } from '../dto';
import { updateOneHarvestJob } from './update';

const logger = appLogger.child({ model: 'harvest', scope: 'models' });

const UPDATE_THROTTLE = 100;

/** Aggregated updates to apply */
const patchs = new Map<string, UpdateHarvestJob>();
/** Throttled functions to update Harvest Job */
const updaters = new Map<string, typeof handleUpdate>();

/**
 * Deeply merge updates of a harvest job
 *
 * @param source - The previous value of the harvest job
 * @param target - The patch to apply
 *
 * @returns - The patched harvest job
 */
const mergeUpdateData = (
  source: UpdateHarvestJob,
  target: UpdateHarvestJob
): UpdateHarvestJob => ({
  ...source,
  ...target,
  // Merge steps
  download: {
    done: source.download?.done ?? target.download?.done ?? false,
    ...source.download,
    ...target.download,
  },
  extract: {
    done: source.extract?.done ?? target.extract?.done ?? false,
    ...source.extract,
    ...target.extract,
  },
});

/**
 * Update status of harvest job in DB and clear state when job is ended
 *
 * @param data - The data to update in harvest job
 */
async function handleUpdate(data: UpdateHarvestJob): Promise<void> {
  try {
    const { status } = await updateOneHarvestJob(data);

    if (status === 'done' || status === 'error') {
      patchs.delete(data.id);
      updaters.delete(data.id);
    }

    logger.debug({
      id: data.id,
      msg: 'Harvest Job updated',
      status,
    });
  } catch (error) {
    logger.error({
      err: error,
      id: data.id,
      msg: 'Unable to update data of Harvest Job',
    });
  }
}

/**
 * Update one Harvest Job but throttled to avoid concurrency issues
 *
 * @param data - The data to update in harvest job
 */
export function updateOneHarvestJobThrottled(data: UpdateHarvestJob): void {
  // Merge new status with previous updates
  let event = data;
  const previous = patchs.get(data.id);
  if (previous) {
    event = mergeUpdateData(previous, data);
  }
  patchs.set(data.id, event);

  // Throttle updates per job
  let update = updaters.get(data.id);
  if (!update) {
    update = createThrottledFunction(handleUpdate, UPDATE_THROTTLE);
    updaters.set(data.id, update);
  }

  void update(event);
}
