import { setTimeout as setTimeoutAsync } from 'node:timers/promises';

import { HarvestJobData } from '@ezcounter/models/queues';
import {
  rabbitmq,
  parseJSONMessage,
  sendJSONMessage,
} from '@ezcounter/rabbitmq';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { harvestReport } from '~/models/report';

import { sendHarvestJobStatusEvent } from './status';

const logger = appLogger.child({ scope: 'queues' });

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
    startedAt: new Date(),
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
    await setTimeoutAsync(pause);
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
async function processHarvestMessage(
  channel: rabbitmq.Channel,
  msg: rabbitmq.GetMessage,
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
    rabbitmq.rejectMessage(channel, msg, false);
    return;
  }

  // Mark job as processing
  markHarvestJobAsProcessing(data, queueName);

  data.try = (data.try ?? 0) + 1;
  const result = await harvestReport(data);

  // We need to requeue report and we have enough tries left
  if (
    (result.processing || result.unavailable) &&
    data.try < config.download.maxTries
  ) {
    data.download.forceDownload = true;
    markHarvestJobAsDelayed(data, queueName);
    // Requeue job
    const { processingBackoff, unavailableBackoff } = config.download;
    await requeueHarvestJob(channel, {
      job: data,
      queueName,
      // Data host is currently processing report - we'll retry later
      delay: result.processing ? processingBackoff : undefined,
      // Data host is currently unavailable - pausing whole data host
      pause: result.unavailable ? unavailableBackoff : undefined,
    });
  }

  rabbitmq.ackMessage(channel, msg);
}

/**
 * Delete queue if no jobs are delayed
 *
 * @param channel - The rabbitmq channel
 * @param queueName - The name of the queue
 *
 * @returns `true` if queue was deleted
 */
async function deleteHarvestQueue(
  channel: rabbitmq.Channel,
  queueName: string
): Promise<boolean> {
  const delayed = delayedJobs.get(queueName);
  if (delayed && delayed.size > 0) {
    logger.debug({
      msg: 'Some jobs are delayed, waiting for them before deleting queue',
      queueName,
    });

    // Waiting a bit more before re-asking for messages
    await setTimeoutAsync(config.download.detachDelay);

    return false;
  }

  try {
    // Delete queue - ifEmpty will close channel if there's still jobs
    await rabbitmq.deleteQueue(channel, queueName, {
      ifEmpty: true,
    });

    logger.debug({
      msg: 'Harvest queue deleted',
      queueName,
    });

    // Queue was deleted, no need to track delayed jobs
    delayedJobs.delete(queueName);
    return true;
  } catch (err) {
    logger.error({
      msg: 'Unable to delete queue',
      queueName,
      err,
    });
    throw err;
  }
}

/**
 * Process all messages in harvest queue
 *
 * @param channel - The rabbitmq channel
 *
 * @return Iterator that will yield after each harvest (or attempt to get harvest), and return when all messages are processed
 */
export async function* processHarvestQueue(
  channel: rabbitmq.Channel,
  queueName: string
): AsyncGenerator<void> {
  await rabbitmq.assertQueue(channel, queueName, {
    durable: false,
  });

  logger.info({
    msg: 'Processing harvest queue',
    queueName,
  });

  // oxlint-disable no-await-in-loop
  while (true) {
    // Get last message
    const msg = await rabbitmq.getMessage(channel, queueName);
    if (msg) {
      await processHarvestMessage(channel, msg, queueName);
    } else {
      // There was no message left in queue
      const deleted = await deleteHarvestQueue(channel, queueName);
      if (deleted) {
        return;
      }
    }

    yield;
  }
  // oxlint-enable no-await-in-loop
}
