import { EnrichJobData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { createConsumer } from '~/lib/rabbitmq';

import { insertEnrichedReportItem } from '~/models/report-item';

const QUEUE_NAME = 'ezcounter:enrich.jobs';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

/**
 * Process enrich job
 *
 * @param job - The job
 */
export async function processEnrichJob(job: EnrichJobData): Promise<void> {
  try {
    await insertEnrichedReportItem(job);
  } catch (error) {
    logger.warn({
      err: error,
      id: job.id,
      msg: 'Error occurred while enriching',
    });
  }
}

/**
 * Consume queue to handle enrich jobs
 */
export function consumeEnrichJobs(): void {
  const sub = createConsumer({
    logger,
    onMessage: processEnrichJob,
    options: {
      qos: { prefetchCount: 1 },
      queue: QUEUE_NAME,
    },
    schema: EnrichJobData,
  });

  sub.on('ready', () => {
    logger.debug('Enrich jobs consumer ready');
  });
}
