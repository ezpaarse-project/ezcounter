import type { rabbitmq } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

import { getHarvestDispatchQueue } from './harvest/dispatch';

const logger = appLogger.child({ scope: 'queues' });

/**
 * Init Harvest Status events
 *
 * @param connection - The RabbitMQ connection
 */
async function initDispatchQueue(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const channel = await connection.createChannel();
  logger.debug({
    msg: 'Channel created',
    for: 'harvest.jobs:status',
  });

  await getHarvestDispatchQueue(channel);
}

/**
 * Init all queues/exchanges that service will use
 *
 * @param connection - The RabbitMQ connection
 */
export async function initQueues(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();

  await initDispatchQueue(connection);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
