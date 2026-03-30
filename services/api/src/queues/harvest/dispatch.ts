import { createHash } from 'node:crypto';

import type { HarvestError } from '@ezcounter/dto/harvest';
import type {
  HarvestDispatchData,
  HarvestJobData,
} from '@ezcounter/dto/queues';
import { rabbitmq, sendJSONMessage } from '@ezcounter/rabbitmq';
import { asHarvestError } from '@ezcounter/toolbox/harvest';

import { appLogger } from '~/lib/logger';

const QUEUE_NAME = 'ezcounter.harvest:dispatch';
const HOST_QUEUE_NAME_HASH_LENGTH = 16;

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

type HarvestQueueInfo = {
  name: string;
  created: boolean;
  error?: HarvestError;
};

type HarvestJobInfo = {
  id: string;
  error?: HarvestError;
};

type HarvestDispatchInfo = {
  error?: HarvestError;
};

// We need a global channel to avoid passing it every time we queue something
let channel: rabbitmq.Channel | null = null;

/**
 * Get queue name for a data host
 *
 * @param host - The hostname of the data host
 *
 * @returns The name of the queue
 */
function getDataHostQueueName(host: string): string {
  const hash = createHash('sha1')
    .update(host)
    .digest('hex')
    .slice(0, HOST_QUEUE_NAME_HASH_LENGTH);

  return `ezcounter.harvest:job:${hash}`;
}

/**
 * Assert exchange used to send events about status of harvest jobs
 *
 * @param chan - The RabbitMQ channel
 */
export async function getHarvestDispatchQueue(
  chan: rabbitmq.Channel
): Promise<void> {
  channel = chan;

  await rabbitmq.assertQueue(chan, QUEUE_NAME, { durable: false });
  logger.debug('Harvest dispatch queue created');
}

/**
 * Ensure a list of data host will have their own queues
 *
 * @param chan - The RabbitMQ channel
 * @param hostNames - List of hosts to ensure queues
 *
 * @returns The information about queues
 */
export const ensureDataHostQueues = async (
  chan: rabbitmq.Channel,
  hostNames: string[]
): Promise<Map<string, HarvestQueueInfo>> =>
  new Map<string, HarvestQueueInfo>(
    await Promise.all(
      hostNames.map(async (host): Promise<[string, HarvestQueueInfo]> => {
        const queue = getDataHostQueueName(host);
        try {
          const { consumerCount, messageCount } = await rabbitmq.assertQueue(
            chan,
            queue,
            { durable: false }
          );

          const created = consumerCount <= 0 && messageCount <= 0;

          logger.debug({
            created,
            msg: 'Asserted harvest queue',
            queue,
          });

          return [host, { created, name: queue }];
        } catch (error) {
          logger.error({
            err: error,
            msg: 'Failed to assert harvest queues',
          });

          const err = asHarvestError(error);
          return [host, { created: false, error: err, name: queue }];
        }
      })
    )
  );

/**
 * Send harvest jobs into queues
 *
 * @param chan - RabbitMQ channel
 * @param queue - Name of queue
 * @param jobs - Jobs to queue
 *
 * @returns Information about jobs
 */
export const sendHarvestJobsInQueue = (
  chan: rabbitmq.Channel,
  queue: HarvestQueueInfo,
  jobs: HarvestJobData[]
): HarvestJobInfo[] =>
  jobs.map((job) => {
    if (queue.error) {
      return { error: queue.error, id: job.id };
    }

    try {
      const { size } = sendJSONMessage(
        { channel: chan, queue: { name: queue.name } },
        job
      );

      logger.trace({
        msg: 'Queued harvest job',
        size,
        sizeUnit: 'B',
      });

      return { id: job.id };
    } catch (error) {
      logger.error({
        err: error,
        msg: 'Failed to queue harvest job',
      });

      const err = asHarvestError(error);
      return { error: err, id: job.id };
    }
  });

/**
 * Send dispatch events
 *
 * @param chan - RabbitMQ channel
 * @param queue - Queue information
 *
 * @returns Information about dispatch
 */
export async function sendDispatchEvent(
  chan: rabbitmq.Channel,
  queue: HarvestQueueInfo
): Promise<HarvestDispatchInfo> {
  if (!queue.created || queue.error) {
    return { error: queue.error };
  }

  try {
    const { size } = sendJSONMessage<HarvestDispatchData>(
      { channel: chan, queue: { name: QUEUE_NAME } },
      { queueName: queue.name }
    );

    logger.debug({
      msg: 'Queued harvest dispatch',
      queue,
      size,
      sizeUnit: 'B',
    });

    return {};
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue harvest dispatch',
    });

    await rabbitmq.deleteQueue(chan, queue.name);

    const err = asHarvestError(error);
    return { error: err };
  }
}

/**
 * Queue jobs for harvesting
 *
 * Will create one queue per host then send the signal to harvesters to start
 *
 * @param jobs - The jobs to queue
 *
 * @returns Info about queued jobs
 */
export async function queueHarvestJobs(
  jobs: HarvestJobData[]
): Promise<HarvestJobInfo[]> {
  if (!channel) {
    throw new Error('Channel not initialised');
  }
  const chan = channel;

  // Group jobs per host
  const jobsPerHost = Map.groupBy<string, HarvestJobData>(
    jobs,
    (job) => new URL(job.download.dataHost.baseUrl).hostname
  );

  // Create harvest queues
  const queues = await ensureDataHostQueues(chan, [...jobsPerHost.keys()]);

  const queuedJobs = await Promise.all(
    [...queues].map(async ([host, queue]): Promise<HarvestJobInfo[]> => {
      const jobsOfHost = jobsPerHost.get(host) ?? [];

      const queued = sendHarvestJobsInQueue(chan, queue, jobsOfHost);

      const event = await sendDispatchEvent(chan, queue);

      if (event.error) {
        return queued.map((info) => ({
          error: info.error ?? event.error,
          id: info.id,
        }));
      }

      return queued;
    })
  );

  return queuedJobs.flat();
}
