import { appLogger } from '~/lib/logger';

import { consumeHarvestJobStatusEvents } from './harvest/jobs/status';
import { consumeHarvestRequests } from './harvest/request';

const logger = appLogger.child({ scope: 'queues' });

/**
 * Init all consumers that service will use
 */
export function initQueueConsumers(): void {
  const start = process.uptime();

  consumeHarvestJobStatusEvents();
  consumeHarvestRequests();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
