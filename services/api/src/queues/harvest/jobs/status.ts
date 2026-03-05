import { createThrottledFunction } from '@ezcounter/models/lib/utils';
import { HarvestJobStatusEvent } from '@ezcounter/models/queues';
import { parseJSONMessage, type rabbitmq } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

import { updateOneHarvestJob } from '~/models/harvest';

const EXCHANGE_NAME = 'ezcounter.harvest:status';

const logger = appLogger.child({ scope: 'queues', exchange: EXCHANGE_NAME });

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
    done: source.download?.done || target.download?.done || false,
    ...source.download,
    ...target.download,
  },
  extract: {
    done: source.extract?.done || target.extract?.done || false,
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
  } catch (err) {
    logger.error({
      msg: 'Unable to update data of Harvest Job',
      err,
    });
  }
}

/**
 * Process Harvest status events
 *
 * Throttle updates per harvest job
 *
 * @param channel - The RabbitMQ channel
 * @param msg - The message
 */
function onMessage(
  channel: rabbitmq.Channel,
  msg: rabbitmq.ConsumeMessage | null
): void {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(
    msg,
    HarvestJobStatusEvent
  );
  if (!data) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
    });
    channel.reject(msg, false);
    return;
  }

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
    update = createThrottledFunction(updateHarvestJobStatus, 100);
    updaters.set(data.id, update);
  }

  update(event);
  channel.ack(msg);
}

/**
 * Consume local queue bound to exchange to handle harvest statuses
 *
 * @param channel - The rabbitmq channel
 */
export async function getHarvestJobStatusEventExchange(
  channel: rabbitmq.Channel
): Promise<void> {
  await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });

  const { queue } = await channel.assertQueue('', {
    durable: false,
  });
  channel.bindQueue(queue, EXCHANGE_NAME, '');

  // Consume harvest queue
  channel.consume(queue, (msg) => onMessage(channel, msg));

  logger.debug('Harvest status queue created');
}
