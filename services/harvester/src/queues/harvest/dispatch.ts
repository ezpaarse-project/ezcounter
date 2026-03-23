import { setTimeout as setTimeoutAsync } from 'node:timers/promises';

import { HarvestDispatchData } from '@ezcounter/dto/queues';
import { rabbitmq, consumeJSONQueue } from '@ezcounter/rabbitmq';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { processHarvestQueue } from './jobs';

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
    const process = processHarvestQueue(jobsChannel, data.queueName);

    // oxlint-disable no-await-in-loop
    while (true) {
      const { done } = await process.next();
      if (done) {
        break;
      }
      // Just a little delay to avoid spamming too fast
      await setTimeoutAsync(config.download.jobDelay);
    }
    // oxlint-enable no-await-in-loop
  } catch (err) {
    logger.error({
      msg: 'Unable to process harvest queue',
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
