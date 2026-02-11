import { setTimeout as sleep } from 'node:timers/promises';

import { HarvestJobData } from '@ezcounter/models/queues';
import {
  parseJSONMessage,
  sendJSONMessage,
  type rabbitmq,
} from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';
import { config } from '~/lib/config';

import { harvestReport } from '~/models/report';

const logger = appLogger.child({ scope: 'queues' });

const {
  processingBackoff,
  unavailableBackoff,
  detachDelay,
  jobDelay,
  maxTries,
} = config.download;

/**
 * Requeue harvest job with some delay
 *
 * @param channel - The rabbitmq channel
 * @param data - Information about message
 * @param delay - The delay to apply
 */
function requeueHarvestJob(
  channel: rabbitmq.Channel,
  data: { msg: HarvestJobData; queueName: string },
  delay = 0
): void {
  try {
    sendJSONMessage({ channel, queue: { name: data.queueName } }, data.msg, {
      headers: { 'x-delay': delay },
    });
    logger.info({
      msg: 'Harvest job requeued',
      queueName: data.queueName,
      id: data.msg.id,
      delay,
    });
  } catch (err) {
    logger.error({
      msg: 'Failed to requeue job',
      queueName: data.queueName,
      id: data.msg.id,
      err,
    });
  }
}

/**
 * Process Harvest Job request
 *
 * @param channel - The RabbitMQ channel
 * @param msg - The message
 * @param queueName - The name of the queue (used to delay jobs)
 */
async function onMessage(
  channel: rabbitmq.Channel,
  msg: rabbitmq.ConsumeMessage,
  queueName: string
): Promise<void> {
  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, HarvestJobData);
  if (!data) {
    logger.error({
      msg: 'Invalid data',
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
    });
    channel.reject(msg);
    return;
  }

  // Just a little delay to avoid spamming too fast
  await sleep(jobDelay);

  data.try = (data.try ?? 0) + 1;
  const result = await harvestReport(data);

  if (data.try < maxTries) {
    // Data host is currently processing report
    if (result.processing) {
      // Requeue job
      requeueHarvestJob(channel, { msg: data, queueName }, processingBackoff);
      channel.ack(msg);
      return;
    }
    // Data host is currently unavailable
    if (result.unavailable) {
      // We're having one dispatch for each data host, and don't ack dispatch until all jobs are completed,
      // we're using `prefetch=1` on both connections to ensure that only one job per data host is processed
      // at the same time.
      // Meaning that if any job hangs, it'll block the whole job queue and prevent any other harvester to
      // pick it up.
      // As if data host is busy every request to it will fail, we want to block the whole queue here
      await sleep(unavailableBackoff);
      // Once delay passed, we can requeue job
      requeueHarvestJob(channel, { msg: data, queueName });
      channel.ack(msg);
      return;
    }
  }
  // Acknowledge message as it was successfully processed
  channel.ack(msg);
}

/**
 * Delete queue if no jobs are in queue
 *
 * @param channel - The rabbitmq channel
 * @param queueName - The name of the queue
 *
 * @returns `true` if queue was deleted
 */
async function detachHarvestJobsQueue(
  channel: rabbitmq.Channel,
  queueName: string
): Promise<boolean> {
  try {
    const { messageCount } = await channel.deleteQueue(queueName, {
      ifEmpty: true,
    });

    if (messageCount <= 0) {
      logger.info({
        msg: 'Harvest queue detached',
        queueName,
      });
      return true;
    }

    return false;
  } catch (err) {
    logger.error({
      msg: 'Unable to detach queue',
      queueName,
      err,
    });
    throw err;
  }
}

/**
 * Consume queue to handle harvest jobs
 *
 * @param channel - The rabbitmq channel
 *
 * @return Promise that resolves when all jobs in target queue are processed
 */
export async function attachHarvestJobsQueue(
  channel: rabbitmq.Channel,
  queueName: string
): Promise<void> {
  const { queue } = await channel.assertQueue(queueName, {
    durable: false,
    exclusive: true,
  });

  // Consume harvest queue as a promise that resolve when all jobs are processed
  // oxlint-disable-next-line promise/avoid-new
  const promise = new Promise<void>((resolve, reject) => {
    channel.consume(queue, async (msg) => {
      if (!msg) {
        return;
      }

      // Process message
      await onMessage(channel, msg, queue);

      // Wait for some time to let possible messages to enter in queue
      setTimeout(async () => {
        // Detach queue if needed
        try {
          if (await detachHarvestJobsQueue(channel, queue)) {
            resolve();
          }
        } catch (err) {
          reject(err);
        }
      }, detachDelay);
    });
  });

  logger.info({
    msg: 'Harvest queue attached',
    queueName,
  });

  return promise;
}
