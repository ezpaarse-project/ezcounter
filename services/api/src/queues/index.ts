import type { rabbitmq } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

import { getHarvestDispatchQueue } from './harvest/dispatch';
import { getHarvestJobStatusEventExchange } from './harvest/jobs/status';

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
    for: 'harvest.dispatch',
  });

  await getHarvestDispatchQueue(channel);
}

/**
 * Init Harvest Status events
 *
 * @param connection - The RabbitMQ connection
 */
async function initHarvestJobStatusExchange(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const channel = await connection.createChannel();
  logger.debug({
    msg: 'Channel created',
    for: 'harvest.jobs:status',
  });

  await getHarvestJobStatusEventExchange(channel);
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
  await initHarvestJobStatusExchange(connection);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
