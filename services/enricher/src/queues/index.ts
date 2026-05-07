import { appLogger } from '~/lib/logger';

import { consumeEnrichJobs } from './enrich/jobs/sub';

const logger = appLogger.child({ scope: 'queues' });

/**
 * Init all consumers that service will use
 */
export function initQueueConsumers(): void {
  const start = process.uptime();

  consumeEnrichJobs();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
