import type { EnrichJobData } from '@ezcounter/dto/queues';
import { EnrichSource } from '@ezcounter/dto/enrich';

import { appLogger } from '~/lib/logger';
import { createPublisher } from '~/lib/rabbitmq';

const EXCHANGE_NAME = 'ezcounter:enrich.jobs';

const logger = appLogger.child({ exchange: EXCHANGE_NAME, scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    confirm: true,
    exchanges: [{ durable: false, exchange: EXCHANGE_NAME, type: 'direct' }],
  },
});

/**
 * Queue job for enrich
 *
 * @param data - The content of the job
 */
export async function queueEnrichJob(data: EnrichJobData): Promise<void> {
  const [nextSource, ...sources] =
    data.enrich?.sources ?? Object.values(EnrichSource.enum);

  try {
    await pub.send(
      {
        exchange: EXCHANGE_NAME,
        // If no enrichment is wanted, go to insert
        routingKey: nextSource || '_insert',
      },
      {
        ...data,
        enrich: {
          ...data.enrich,
          sources,
        },
      } satisfies EnrichJobData
    );

    logger.trace({
      msg: 'Queued enrich job',
      routingKey: nextSource,
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue enrich job',
      routingKey: nextSource,
    });
  }
}
