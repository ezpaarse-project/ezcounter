import { milliseconds } from 'date-fns';

import { HarvestDispatchData } from '@ezcounter/dto/queues';
import { waitForGenerator } from '@ezcounter/toolbox/utils';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { createConsumer } from '~/lib/rabbitmq';

import { processHarvestQueue } from './jobs';

const QUEUE_NAME = 'ezcounter:harvest.dispatch';

const { download: config } = appConfig;
const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

/**
 * Process Harvest dispatch
 *
 * @param data - The dispatch event
 * @param jobsChannel - The RabbitMQ channel for jobs messages
 */
async function onHarvestDispatch(data: HarvestDispatchData): Promise<void> {
  // Wait for all harvest jobs in queue to be processed
  try {
    await waitForGenerator(
      processHarvestQueue(data.queueName),
      // Just a little delay to avoid spamming too fast
      config.jobDelay.milliseconds || milliseconds(config.jobDelay)
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
 */
export function consumeHarvestDispatchJobs(): void {
  const sub = createConsumer({
    logger,
    onMessage: onHarvestDispatch,
    options: {
      qos: { prefetchCount: 1 },
      queue: QUEUE_NAME,
    },
    schema: HarvestDispatchData,
  });

  sub.on('ready', () => {
    logger.debug('Harvest dispatch consumer ready');
  });
}
