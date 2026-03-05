import { HarvestDispatchData } from '@ezcounter/models/queues';
import { rabbitmq, consumeJSONQueue } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

import { proccessHarvestQueue } from './jobs';

const QUEUE_NAME = 'ezcounter.harvest:dispatch';

const logger = appLogger.child({ scope: 'queues', queue: QUEUE_NAME });

/**
 * Process Harvest dispatch
 *
 * @param data - The dispatch event
 * @param jobsChannel - The RabbitMQ channel for jobs messages
 */
async function onHarvestDispatch(
  data: HarvestDispatchData,
  jobsChannel: rabbitmq.Channel
): Promise<void> {
  // Wait for all harvest jobs in queue to be processed
  try {
    await proccessHarvestQueue(jobsChannel, data.queueName);
  } catch (err) {
    logger.error({
      msg: 'Unable to proccess harvest queue',
      err,
    });
  }
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
  await rabbitmq.assertQueue(dispatchChannel, QUEUE_NAME, {
    durable: false,
  });

  // Consume harvest queue
  await consumeJSONQueue({
    channel: dispatchChannel,
    queue: QUEUE_NAME,
    logger,
    schema: HarvestDispatchData,
    onMessage: (data) => onHarvestDispatch(data, jobsChannel),
  });

  logger.debug('Harvest dispatch queue created');
}
