import { sendJSONMessage, type rabbitmq } from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

const QUEUE_NAME = 'ezcounter.enrich:jobs';

const logger = appLogger.child({ scope: 'queues', queue: QUEUE_NAME });

// We need a global channel to avoid passing it every time we queue something
let channel: rabbitmq.Channel | undefined;

/**
 * Assert exchange used to send events about status of harvest jobs
 *
 * @param chan - The RabbitMQ channel
 */
export async function getEnrichJobQueue(chan: rabbitmq.Channel): Promise<void> {
  channel = chan;

  await chan.assertQueue(QUEUE_NAME, { durable: false });
  logger.debug('Enrich queue created');
}

/**
 * Queue job for enrich
 *
 * @param data - The content of the job
 */
export function queueEnrichJob(data: unknown): void {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  try {
    const { size } = sendJSONMessage(
      { channel, queue: { name: QUEUE_NAME } },
      data
    );
    logger.trace({
      msg: 'Queued enrich job',
      size,
      sizeUnit: 'B',
    });
  } catch (err) {
    logger.error({
      msg: 'Failed to queue enrich job',
      err,
    });
  }
}
