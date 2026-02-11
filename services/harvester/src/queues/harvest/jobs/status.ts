import type { HarvestJobStatusEvent } from '@ezcounter/models/queues';
import { sendJSONMessage, type rabbitmq } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

const EXCHANGE_NAME = 'ezcounter.harvest:event';

const logger = appLogger.child({ scope: 'queues', exchange: EXCHANGE_NAME });

// We need a global channel to avoid passing it every time we send an event
let channel: rabbitmq.Channel | undefined;

/**
 * Assert exchange used to send events about status of harvest jobs
 *
 * @param chan - The RabbitMQ channel
 */
export async function getHarvestJobStatusEventExchange(
  chan: rabbitmq.Channel
): Promise<void> {
  channel = chan;

  await chan.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });
  logger.debug('Event exchange created');
}

/**
 * Send a event about status of harvest jobs
 *
 * @param data - The content of the event
 */
export function sendHarvestJobStatusEvent(data: HarvestJobStatusEvent): void {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  try {
    const { size } = sendJSONMessage(
      { channel, exchange: { name: EXCHANGE_NAME, routingKey: '' } },
      data
    );
    logger.trace({
      jobId: data.id,
      msg: 'Event sent',
      size,
      sizeUnit: 'B',
    });
  } catch (err) {
    logger.error({
      jobId: data.id,
      msg: 'Failed to send event sent',
      err,
    });
  }
}
