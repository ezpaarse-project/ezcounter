import type { rabbitmq } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

import { getEnrichJobQueue } from './enrich';
import { getHarvestDispatchQueue } from './harvest/dispatch';
import { getHarvestJobStatusEventExchange } from './harvest/jobs/status';

const logger = appLogger.child({ scope: 'queues' });

/**
 * Init enrich queue
 *
 * @param connection - The RabbitMQ connection
 */
async function initEnrichQueue(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const channel = await connection.createChannel();
  logger.debug({
    msg: 'Channel created',
    for: 'enrich.jobs',
  });

  await getEnrichJobQueue(channel);
}

/**
 * Init Harvest Status events
 *
 * @param connection - The RabbitMQ connection
 */
async function initJobsStatusExchange(
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
 * Init Harvest Dispatch queues and channels
 *
 * @param connection - The RabbitMQ connection
 */
async function initDispatchQueue(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const dispatchChannel = await connection.createChannel();
  // Handle one harvest dispatch at the time
  await dispatchChannel.prefetch(1);
  logger.debug({
    msg: 'Channel created',
    prefetch: 1,
    for: 'harvest.dispatch',
  });

  const jobsChannel = await connection.createChannel();
  // Handle one harvest jobs at the time
  await jobsChannel.prefetch(1);
  logger.debug({
    msg: 'Channel created',
    prefetch: 1,
    for: 'harvest.jobs',
  });

  await getHarvestDispatchQueue(dispatchChannel, jobsChannel);
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

  await initEnrichQueue(connection);
  await initJobsStatusExchange(connection);
  await initDispatchQueue(connection);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
