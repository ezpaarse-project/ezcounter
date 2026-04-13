import { HarvestDispatchData } from '@ezcounter/dto/queues';
import { consumeJSONQueue, rabbitmq } from '@ezcounter/rabbitmq';
import { waitForGenerator } from '@ezcounter/toolbox/utils';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { processHarvestQueue } from './jobs';

const QUEUE_NAME = 'ezcounter:harvest.dispatch';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

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
    await waitForGenerator(
      processHarvestQueue(jobsChannel, data.queueName),
      // Just a little delay to avoid spamming too fast
      config.download.jobDelay
    );
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to process harvest queue',
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
    logger,
    onMessage: (data) => onHarvestDispatch(data, jobsChannel),
    queue: QUEUE_NAME,
    schema: HarvestDispatchData,
  });

  logger.debug('Harvest dispatch queue created');
}
