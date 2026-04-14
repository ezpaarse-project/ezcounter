import type { HarvestJobStatusEvent } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { createPublisher } from '~/lib/rabbitmq';

const EXCHANGE_NAME = 'ezcounter:harvest.status';

const logger = appLogger.child({ exchange: EXCHANGE_NAME, scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    exchanges: [{ durable: false, exchange: EXCHANGE_NAME, type: 'fanout' }],
  },
});

/**
 * Send a event about status of harvest jobs
 *
 * @param data - The content of the event
 */
export async function sendHarvestJobStatusEvent(
  data: HarvestJobStatusEvent
): Promise<void> {
  try {
    await pub.send({ exchange: EXCHANGE_NAME }, data);

    logger.trace({
      jobId: data.id,
      msg: 'Event sent',
    });
  } catch (error) {
    logger.error({
      err: error,
      jobId: data.id,
      msg: 'Failed to send event',
    });
  }
}
