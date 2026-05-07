import type { EnrichSource } from '@ezcounter/dto/enrich';
import { EnrichJobData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { createConsumer } from '~/lib/rabbitmq';

import { enrichReportItem } from '~/models/report-item/steps/enrich';
import { insertReportItem } from '~/models/report-item/steps/insert';

const EXCHANGE_NAME = 'ezcounter:enrich.jobs';

const logger = appLogger.child({ exchange: EXCHANGE_NAME, scope: 'queues' });

/**
 * Shorthand to create a consumer for enrich jobs
 *
 * @param routingKey - The type of enrichment
 * @param onMessage - The function to handle jobs
 */
function createEnrichConsumer(
  routingKey: EnrichSource | '_insert',
  onMessage: (data: EnrichJobData) => Promise<void>
): void {
  const sub = createConsumer({
    logger,
    onMessage,
    options: {
      exchanges: [{ durable: false, exchange: EXCHANGE_NAME, type: 'direct' }],
      qos: { prefetchCount: 1 },
      queueBindings: [{ exchange: EXCHANGE_NAME, routingKey }],
      queueOptions: { durable: false, exclusive: true },
    },
    schema: EnrichJobData,
  });

  sub.on('ready', () => {
    logger.debug({
      msg: 'Enrich jobs consumer ready',
      routingKey,
    });
  });
}

/**
 * Consume queue to handle enrich jobs
 */
export function consumeEnrichJobs(): void {
  createEnrichConsumer('ezunpaywall', (job) =>
    // As prefetchCount is 1, await will block the whole worker until further enrich from ezUnpaywall are possible
    enrichReportItem('ezunpaywall', job)
  );

  createEnrichConsumer('openalex', (job) =>
    // As prefetchCount is 1, await will block the whole worker until further enrich from OpenAlex are possible
    enrichReportItem('openalex', job)
  );

  createEnrichConsumer('_insert', (job) =>
    // As prefetchCount is 1, await will block the whole worker until until insert are possible
    insertReportItem(job)
  );
}
