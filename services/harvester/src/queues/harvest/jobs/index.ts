import { setTimeout as setTimeoutAsync } from 'node:timers/promises';

import { HarvestJobData } from '@ezcounter/dto/queues';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { rabbitClient, type rabbitmq } from '~/lib/rabbitmq';

import { harvestReport } from '~/models/report';

import { sendHarvestJobStatusEvent } from './status';

const { download: config } = appConfig;
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
  void sendHarvestJobStatusEvent({
    id: job.id,
    startedAt: new Date(),
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
  void sendHarvestJobStatusEvent({
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
      pause,
      queue: data.queueName,
    });
    // We're having one dispatch for each data host, and don't ack dispatch until all jobs are completed,
    // We're using `prefetch=1` on both connections to ensure that only one job per data host is processed
    // At the same time.
    // Meaning that if any job hangs, it'll block the whole job queue and prevent any other harvester to
    // Pick it up.
    // As if data host is busy every request to it will fail, we want to block the whole queue here
    await setTimeoutAsync(pause);
  }

  try {
    await channel.basicPublish(
      { headers: { 'x-delay': delay }, routingKey: data.queueName },
      data.job
    );

    logger.info({
      delay,
      id: data.job.id,
      msg: 'Harvest job requeued',
      queue: data.queueName,
    });
  } catch (error) {
    logger.error({
      err: error,
      id: data.job.id,
      msg: 'Failed to requeue job',
      queue: data.queueName,
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
  msg: rabbitmq.SyncMessage,
  queueName: string
): Promise<void> {
  // Parse message
  let data = null;
  try {
    data = HarvestJobData.parse(msg.body);
  } catch (error) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : msg.body,
      err: error,
      msg: 'Invalid data',
      queue: queueName,
    });
    channel.basicNack({ deliveryTag: msg.deliveryTag, requeue: false });
    return;
  }

  // Mark job as processing
  markHarvestJobAsProcessing(data, queueName);

  data.try = (data.try ?? 0) + 1;
  const result = await harvestReport(data);

  // We need to requeue report and we have enough tries left
  if ((result.processing || result.unavailable) && data.try < config.maxTries) {
    data.download.forceDownload = true;
    markHarvestJobAsDelayed(data, queueName);
    // Requeue job
    await requeueHarvestJob(channel, {
      // Data host is currently processing report - we'll retry later
      delay: result.processing ? config.processingBackoff : undefined,
      job: data,
      // Data host is currently unavailable - pausing whole data host
      pause: result.unavailable ? config.unavailableBackoff : undefined,
      queueName,
    });
  }

  channel.basicAck({ deliveryTag: msg.deliveryTag });
}

/**
 * Delete queue if no jobs are delayed
 *
 * @param channel - The rabbitmq channel
 * @param queue - The name of the queue
 *
 * @returns `true` if queue was deleted
 */
async function deleteHarvestQueue(
  channel: rabbitmq.Channel,
  queue: string
): Promise<boolean> {
  const delayed = delayedJobs.get(queue);
  if (delayed && delayed.size > 0) {
    logger.debug({
      msg: 'Some jobs are delayed, waiting for them before deleting queue',
      queue,
    });

    // Waiting a bit more before re-asking for messages
    await setTimeoutAsync(config.detachDelay);

    return false;
  }

  try {
    // Delete queue - ifEmpty will close channel if there's still jobs
    await channel.queueDelete({ ifEmpty: true, queue });

    logger.debug({
      msg: 'Harvest queue deleted',
      queue,
    });

    // Queue was deleted, no need to track delayed jobs
    delayedJobs.delete(queue);
    return true;
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to delete queue',
      queue,
    });
    throw error;
  }
}

/**
 * Process all messages in harvest queue
 *
 * @param queue - The name of the queue to process
 *
 * @yields After each harvest (or attempt to get harvest)
 *
 * @returns When all messages are processed
 */
export async function* processHarvestQueue(queue: string): AsyncGenerator {
  const channel = await rabbitClient.acquire();
  await channel.queueDeclare({ durable: false, queue });

  logger.info({
    msg: 'Processing harvest queue',
    queue,
  });

  // oxlint-disable no-await-in-loop
  while (true) {
    // Get last message
    const msg = await channel.basicGet({ queue });
    if (msg) {
      await processHarvestMessage(channel, msg, queue);
    } else {
      // There was no message left in queue
      const deleted = await deleteHarvestQueue(channel, queue);
      if (deleted) {
        break;
      }
    }

    yield;
  }
  // oxlint-enable no-await-in-loop

  await channel.close();
}
