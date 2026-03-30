import { rabbitmq } from '@ezcounter/rabbitmq';

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
  const channel = await rabbitmq.createChannel(connection);
  logger.debug({
    for: 'enrich.jobs',
    msg: 'Channel created',
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
  const channel = await rabbitmq.createChannel(connection);
  logger.debug({
    for: 'harvest.jobs:status',
    msg: 'Channel created',
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
  const dispatchChannel = await rabbitmq.createChannel(connection);
  // Handle one harvest dispatch at the time
  await rabbitmq.setPrefetchCount(dispatchChannel, 1);
  logger.debug({
    for: 'harvest.dispatch',
    msg: 'Channel created',
    prefetch: 1,
  });

  const jobsChannel = await rabbitmq.createChannel(connection);
  // Handle one harvest jobs at the time
  await rabbitmq.setPrefetchCount(jobsChannel, 1);
  logger.debug({
    for: 'harvest.jobs',
    msg: 'Channel created',
    prefetch: 1,
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
