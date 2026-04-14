import { appLogger } from '~/lib/logger';
import { createPublisher } from '~/lib/rabbitmq';

const QUEUE_NAME = 'ezcounter:enrich.jobs';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    queues: [{ durable: false, queue: QUEUE_NAME }],
  },
});

/**
 * Queue job for enrich
 *
 * @param data - The content of the job
 */
export async function queueEnrichJob(data: unknown): Promise<void> {
  try {
    await pub.send({ routingKey: QUEUE_NAME }, data);

    logger.trace({
      msg: 'Queued enrich job',
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue enrich job',
    });
  }
}
