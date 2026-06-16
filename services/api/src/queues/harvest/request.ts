import { randomUUID } from 'node:crypto';

import type { MessageMeta } from '@ezcounter/rabbitmq';
import { HarvestRequestData } from '@ezcounter/dto/queues';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { createConsumer, createPublisher } from '~/lib/rabbitmq';

import { createManyHarvestJob, failManyHarvestJob } from '~/models/harvest';
import { prepareHarvestJobsFromHarvestRequest } from '~/models/harvest-request';

import { queueHarvestJobs } from './dispatch';

const QUEUE_NAME = 'ezcounter:harvest.request';

const supportedConfig = appConfig.dataHost.supported;
const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    queues: [{ durable: true, queue: QUEUE_NAME }],
  },
});

/**
 * Process Harvest request
 *
 * @param data - The harvest request to process
 * @param meta - Message meta
 */
export async function onHarvestRequest(
  data: HarvestRequestData,
  meta: MessageMeta
): Promise<void> {
  try {
    // Create harvest jobs from request
    const jobs = await prepareHarvestJobsFromHarvestRequest(
      data,
      supportedConfig.fetchDelay
    );
    await createManyHarvestJob(jobs, meta.messageId || '');
    const queued = await queueHarvestJobs(jobs);

    // Mark as failed jobs that weren't queued
    await failManyHarvestJob(
      queued
        .map(({ id, error }) => (error ? { error, id } : null))
        // oxlint-disable-next-line no-implicit-coercion - Type guard fails with Boolean
        .filter((job) => !!job)
    );
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to process Harvest Request',
    });
  }
}

/**
 * Queue request to harvest
 *
 * @param data - The request to queue
 * @param requestId - The ID of the request, defaults to an random UUID
 *
 * @returns The ID of the request
 */
export async function queueHarvestRequest(
  data: HarvestRequestData,
  requestId?: string
): Promise<string> {
  const messageId = requestId || randomUUID();

  try {
    await pub.send({ messageId, routingKey: QUEUE_NAME }, data);
    logger.trace('Harvest request queued');
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue harvest request',
    });
  }

  return messageId;
}

/**
 * Setup consumer for harvest requests
 */
export function consumeHarvestRequests(): void {
  const sub = createConsumer({
    logger,
    onMessage: onHarvestRequest,
    options: {
      qos: { prefetchCount: 1 },
      queue: QUEUE_NAME,
      queueOptions: { durable: true },
    },
    schema: HarvestRequestData,
  });

  sub.on('ready', () => {
    logger.debug('Harvest request consumer ready');
  });
}
