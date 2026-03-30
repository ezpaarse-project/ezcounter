import { HarvestJobStatusEvent } from '@ezcounter/dto/queues';
import { consumeJSONQueue, rabbitmq } from '@ezcounter/rabbitmq';
import { createThrottledFunction } from '@ezcounter/toolbox/utils';

import { appLogger } from '~/lib/logger';

import { updateOneHarvestJob } from '~/models/harvest';

const EXCHANGE_NAME = 'ezcounter.harvest:status';
const HARVEST_JOB_UPDATE_THROTTLE = 100;

const logger = appLogger.child({ exchange: EXCHANGE_NAME, scope: 'queues' });

/** Aggregated events to apply */
const patchs = new Map<string, HarvestJobStatusEvent>();
/** Throttled functions to update Harvest Job */
const updaters = new Map<
  string,
  (patch: HarvestJobStatusEvent) => Promise<void>
>();

/**
 * Deeply merge events of a harvest job
 *
 * @param source - The previous value of the harvest job
 * @param target - The patch to apply
 *
 * @returns - The patched harvest job
 */
const mergeEvents = (
  source: HarvestJobStatusEvent,
  target: HarvestJobStatusEvent
): HarvestJobStatusEvent => ({
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
 * Update status of harvest job in DB
 *
 * @param event - The event
 */
async function updateHarvestJobStatus(
  event: HarvestJobStatusEvent
): Promise<void> {
  // Update job with received data
  try {
    const { status } = await updateOneHarvestJob({ ...event });

    if (status === 'done' || status === 'error') {
      patchs.delete(event.id);
      updaters.delete(event.id);
    }
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to update data of Harvest Job',
    });
  }
}

/**
 * Process Harvest status events
 *
 * Throttle updates per harvest job
 *
 * @param data - The event
 */
export function onHarvestJobStatus(data: HarvestJobStatusEvent): void {
  // Merge new status with previous updates
  let event = data;
  const previous = patchs.get(data.id);
  if (previous) {
    event = mergeEvents(previous, data);
  }
  patchs.set(data.id, event);

  // Throttle updates per job
  let update = updaters.get(data.id);
  if (!update) {
    update = createThrottledFunction(
      updateHarvestJobStatus,
      HARVEST_JOB_UPDATE_THROTTLE
    );
    updaters.set(data.id, update);
  }

  void update(event);
}

/**
 * Consume local queue bound to exchange to handle harvest statuses
 *
 * @param channel - The rabbitmq channel
 */
export async function getHarvestJobStatusEventExchange(
  channel: rabbitmq.Channel
): Promise<void> {
  await rabbitmq.assertExchange(channel, EXCHANGE_NAME, 'fanout', {
    durable: false,
  });

  const { queue } = await rabbitmq.assertQueue(channel, '', {
    durable: false,
    exclusive: true,
  });

  void rabbitmq.bindQueueToExchange(channel, queue, EXCHANGE_NAME, '');

  // Consume harvest queue
  await consumeJSONQueue({
    channel,
    logger,
    onMessage: (data) => {
      onHarvestJobStatus(data);
    },
    queue,
    schema: HarvestJobStatusEvent,
  });

  logger.debug('Harvest status queue created');
}
