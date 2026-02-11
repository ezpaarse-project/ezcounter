import { parseJSONMessage, type rabbitmq } from '@ezcounter/rabbitmq';
import { HarvestDispatchData } from '@ezcounter/models/queues';

import { appLogger } from '~/lib/logger';

import { attachHarvestJobsQueue } from './jobs';

const QUEUE_NAME = 'ezcounter.harvest:dispatch';

const logger = appLogger.child({ scope: 'queues', queue: QUEUE_NAME });

/**
 * Process Harvest dispatch
 *
 * @param dispatchChannel - The RabbitMQ channel for dispatch messages
 * @param jobsChannel - The RabbitMQ channel for jobs messages
 * @param msg - The message
 */
async function onMessage(
  dispatchChannel: rabbitmq.Channel,
  jobsChannel: rabbitmq.Channel,
  msg: rabbitmq.ConsumeMessage | null
): Promise<void> {
  if (!msg) {
    return;
  }

  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, HarvestDispatchData);
  if (!data) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
    });
    dispatchChannel.reject(msg);
    return;
  }

  // Wait for all harvest jobs in queue to be processed
  await attachHarvestJobsQueue(jobsChannel, data.queueName);

  // Acknowledge message as all jobs are complete
  dispatchChannel.ack(msg);
}

/**
 * Consume queue to handle harvest dispatch
 *
 * @param dispatchChannel - The rabbitmq channel for dispatch messages
 * @param jobsChannel - The rabbitmq channel for jobs messages
 */
export async function getHarvestDispatchQueue(
  dispatchChannel: rabbitmq.Channel,
  jobsChannel: rabbitmq.Channel
): Promise<void> {
  const { queue } = await dispatchChannel.assertQueue(QUEUE_NAME, {
    durable: false,
  });

  // Consume harvest queue
  dispatchChannel.consume(queue, (msg) =>
    onMessage(dispatchChannel, jobsChannel, msg)
  );

  logger.debug('Harvest queue created');
}
