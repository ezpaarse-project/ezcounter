import { EnrichJobStatusEvent } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { createConsumer } from '~/lib/rabbitmq';

import { updateOneHarvestJobThrottled } from '~/models/harvest';

const EXCHANGE_NAME = 'ezcounter:enrich.jobs.status';

const logger = appLogger.child({ exchange: EXCHANGE_NAME, scope: 'queues' });

/**
 * Process Enrich status events
 *
 * Throttle updates per harvest job
 *
 * @param data - The event
 */
export function onEnrichJobStatus(data: EnrichJobStatusEvent): void {
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
export function consumeEnrichJobStatusEvents(): void {
  const sub = createConsumer({
    logger,
    onMessage: onEnrichJobStatus,
    options: {
      exchanges: [{ durable: false, exchange: EXCHANGE_NAME, type: 'fanout' }],
      queueOptions: { durable: false, exclusive: true },
    },
    schema: EnrichJobStatusEvent,
  });

  sub.on('ready', () => {
    logger.debug('Harvest status consumer ready');
  });
}
