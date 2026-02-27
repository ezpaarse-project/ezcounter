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

import { sendHarvestJobStatusEvent } from './status';

const logger = appLogger.child({ scope: 'queues' });

const {
  processingBackoff,
  unavailableBackoff,
  detachDelay,
  jobDelay,
  maxTries,
} = config.download;

const delayedJobs = new Map<string, Set<string>>();

/**
 * Mark harvest job as processing
 *
 * @param job - The job
 * @param queueName - The name of the queue
 */
function markHarvestJobAsProcessing(
  job: HarvestJobData,
  queueName: string
): void {
  sendHarvestJobStatusEvent({
    id: job.id,
    status: 'processing',
  });

  // Keep track of delayed jobs
  const delayed = delayedJobs.get(queueName);
  if (delayed?.has(job.id)) {
    delayed.delete(job.id);
    delayedJobs.set(queueName, delayed);
  }
}
/**
 * Mark harvest job as delayed
 *
 * @param job - The job
 * @param queueName - The name of the queue
 */
function markHarvestJobAsDelayed(job: HarvestJobData, queueName: string): void {
  sendHarvestJobStatusEvent({
    id: job.id,
    status: 'delayed',
  });

  // Keep track of delayed jobs
  const delayed = delayedJobs.get(queueName) ?? new Set();
  delayed.add(job.id);
  delayedJobs.set(queueName, delayed);
}

type RequeueData = {
  /** The harvest job */
  job: HarvestJobData;
  /** The queue where to requeue the job */
  queueName: string;
  /** The delay to apply to message, none by default */
  delay?: number;
  /** The time to pause queue, none by default */
  pause?: number;
};

/**
 * Requeue harvest job with some delay
 *
 * @param channel - The rabbitmq channel
 * @param data - How to requeue job
 */
async function requeueHarvestJob(
  channel: rabbitmq.Channel,
  data: RequeueData
): Promise<void> {
  const pause = data.pause ? Math.max(1, data.pause) : 0;
  const delay = data.delay ? Math.max(1, data.delay) : undefined;

  // Pause whole queue if needed
  if (pause > 0) {
    logger.info({
      msg: 'Pausing queue',
      queueName: data.queueName,
      pause,
    });
    // We're having one dispatch for each data host, and don't ack dispatch until all jobs are completed,
    // we're using `prefetch=1` on both connections to ensure that only one job per data host is processed
    // at the same time.
    // Meaning that if any job hangs, it'll block the whole job queue and prevent any other harvester to
    // pick it up.
    // As if data host is busy every request to it will fail, we want to block the whole queue here
    await sleep(pause);
  }

  try {
    sendJSONMessage({ channel, queue: { name: data.queueName } }, data.job, {
      headers: { 'x-delay': delay },
    });
    logger.info({
      msg: 'Harvest job requeued',
      queueName: data.queueName,
      id: data.job.id,
      delay,
    });
  } catch (err) {
    logger.error({
      msg: 'Failed to requeue job',
      queueName: data.queueName,
      id: data.job.id,
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

  // Mark job as processing
  markHarvestJobAsProcessing(data, queueName);

  // Just a little delay to avoid spamming too fast
  await sleep(jobDelay);

  data.try = (data.try ?? 0) + 1;
  const result = await harvestReport(data);

  // We need to requeue report and we have enough tries left
  if ((result.processing || result.unavailable) && data.try < maxTries) {
    // Mark job as delayed - It'll be picked up later
    markHarvestJobAsDelayed(data, queueName);
    // Requeue job
    await requeueHarvestJob(channel, {
      job: data,
      queueName,
      // Data host is currently processing report - we'll retry later
      delay: result.processing ? processingBackoff : undefined,
      // Data host is currently unavailable - pausing whole data host
      pause: result.unavailable ? unavailableBackoff : undefined,
    });
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
  // Don't detach if there's still delayed jobs
  const delayed = delayedJobs.get(queueName);
  if (delayed && delayed.size > 0) {
    return false;
  }

  try {
    // Check if there's messages in queue
    const { messageCount } = await channel.checkQueue(queueName);
    if (messageCount > 0) {
      return false;
    }

    // Delete queue - ifEmpty will close channel if there's still jobs
    await channel.deleteQueue(queueName, {
      ifEmpty: true,
    });

    logger.info({
      msg: 'Harvest queue detached',
      queueName,
    });

    // Queue was deleted, no need to track delayed jobs
    delayedJobs.delete(queueName);
    return true;
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
