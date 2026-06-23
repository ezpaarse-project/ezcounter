import type { Prisma } from '@ezcounter/database';
import { createThrottledFunction } from '@ezcounter/toolbox/utils';

import { appLogger } from '~/lib/logger';

import type { UpdateHarvestJob } from '../dto';
import { mergeUpdateData, updateOneHarvestJob } from './update';

const logger = appLogger.child({ model: 'harvest', scope: 'models' });

const UPDATE_THROTTLE = 100;

/** Aggregated updates to apply */
const patchs = new Map<string, UpdateHarvestJob>();
/** Throttled functions to update Harvest Job */
const updaters = new Map<string, typeof handleUpdate>();

/**
 * Update status of harvest job in DB and clear state when job is ended
 *
 * @param id - The id of harvest job to update
 * @param tx - The DB client (can be a transaction)
 */
async function handleUpdate(
  id: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  const data = patchs.get(id);
  patchs.delete(id);

  try {
    const { status } = await updateOneHarvestJob({ id, ...data }, tx);

    if (status === 'done' || status === 'error') {
      updaters.delete(id);
    }

    logger.trace({
      id,
      msg: 'Harvest Job updated',
      status,
    });
  } catch (error) {
    logger.error({
      err: error,
      id,
      msg: 'Unable to update data of Harvest Job',
    });
  }
}

/**
 * Update one Harvest Job but throttled to avoid concurrency issues
 *
 * @param data - The data to update in harvest job
 * @param tx - The DB client (can be a transaction)
 */
export function updateOneHarvestJobThrottled(
  data: UpdateHarvestJob,
  tx: Prisma.TransactionClient
): void {
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

  void update(data.id, tx);
}
