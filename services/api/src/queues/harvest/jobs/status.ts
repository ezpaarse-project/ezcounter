import { HarvestJobStatusEvent } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { createConsumer } from '~/lib/rabbitmq';

import { updateOneHarvestJobThrottled } from '~/models/harvest';

const EXCHANGE_NAME = 'ezcounter:harvest.jobs.status';

const logger = appLogger.child({ exchange: EXCHANGE_NAME, scope: 'queues' });

/**
 * Process Harvest status events
 *
 * Throttle updates per harvest job
 *
 * @param data - The event
 */
export function onHarvestJobStatus(data: HarvestJobStatusEvent): void {
  try {
    updateOneHarvestJobThrottled(data);
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to process Harvest Job status event',
    });
  }
}

/**
 * Setup consumer for harvest job status events
 */
export function consumeHarvestJobStatusEvents(): void {
  const sub = createConsumer({
    logger,
    onMessage: onHarvestJobStatus,
    options: {
      exchanges: [{ durable: false, exchange: EXCHANGE_NAME, type: 'fanout' }],
      queueBindings: [{ exchange: EXCHANGE_NAME }],
      queueOptions: { durable: false, exclusive: true },
    },
    schema: HarvestJobStatusEvent,
  });

  sub.on('ready', () => {
    logger.debug('Harvest status consumer ready');
  });
}
