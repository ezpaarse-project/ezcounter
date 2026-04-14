import { appLogger } from '~/lib/logger';

import { consumeHarvestDispatchJobs } from './harvest/dispatch';

const logger = appLogger.child({ scope: 'queues' });

/**
 * Init all consumers that service will use
 */
export function initQueueConsumers(): void {
  const start = process.uptime();

  consumeHarvestDispatchJobs();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
