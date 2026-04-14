import { createHash } from 'node:crypto';

import type { HarvestError } from '@ezcounter/dto/harvest';
import type {
  HarvestDispatchData,
  HarvestJobData,
} from '@ezcounter/dto/queues';
import { asHarvestError } from '@ezcounter/toolbox/harvest';

import { appLogger } from '~/lib/logger';
import { createPublisher, rabbitClient, type rabbitmq } from '~/lib/rabbitmq';

const QUEUE_NAME = 'ezcounter:harvest.dispatch';
const HOST_QUEUE_NAME_HASH_LENGTH = 16;

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    confirm: true,
    queues: [{ durable: false, queue: QUEUE_NAME }],
  },
});

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

  return `ezcounter:harvest.job:${hash}`;
}

/**
 * Ensure a list of data host will have their own queues
 *
 * @param channel - The RabbitMQ channel
 * @param hostNames - List of hosts to ensure queues
 *
 * @returns The information about queues
 */
export const ensureDataHostQueues = async (
  channel: rabbitmq.Channel,
  hostNames: string[]
): Promise<Map<string, HarvestQueueInfo>> =>
  new Map<string, HarvestQueueInfo>(
    await Promise.all(
      hostNames.map(async (host): Promise<[string, HarvestQueueInfo]> => {
        const queue = getDataHostQueueName(host);
        try {
          const { consumerCount, messageCount } = await channel.queueDeclare({
            durable: false,
            queue,
          });

          const created = consumerCount <= 0 && messageCount <= 0;

          logger.debug({
            created,
            msg: 'Declared harvest queue',
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
 * @param queue - Name of queue
 * @param jobs - Jobs to queue
 *
 * @returns Information about jobs
 */
export const sendHarvestJobsInQueue = (
  queue: HarvestQueueInfo,
  jobs: HarvestJobData[]
): Promise<HarvestJobInfo[]> =>
  Promise.all(
    jobs.map(async (job) => {
      if (queue.error) {
        return { error: queue.error, id: job.id };
      }

      try {
        await pub.send(
          { messageId: job.id, routingKey: queue.name },
          job satisfies HarvestJobData
        );

        logger.trace({
          msg: 'Queued harvest job',
          queue,
        });

        return { id: job.id };
      } catch (error) {
        logger.error({
          err: error,
          msg: 'Failed to queue harvest job',
          queue,
        });

        const err = asHarvestError(error);
        return { error: err, id: job.id };
      }
    })
  );

/**
 * Send dispatch events
 *
 * @param channel - RabbitMQ channel
 * @param queue - Queue information
 *
 * @returns Information about dispatch
 */
export async function sendDispatchEvent(
  channel: rabbitmq.Channel,
  queue: HarvestQueueInfo
): Promise<HarvestDispatchInfo> {
  if (!queue.created || queue.error) {
    return { error: queue.error };
  }

  try {
    await pub.send({ routingKey: QUEUE_NAME }, {
      queueName: queue.name,
    } satisfies HarvestDispatchData);

    logger.debug({
      msg: 'Queued harvest dispatch',
      queue,
    });

    return {};
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue harvest dispatch',
      queue,
    });

    await channel.queueDelete(queue.name);

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
  // Group jobs per host
  const jobsPerHost = Map.groupBy<string, HarvestJobData>(
    jobs,
    (job) => new URL(job.download.dataHost.baseUrl).hostname
  );

  const channel = await rabbitClient.acquire();

  const queues = await ensureDataHostQueues(channel, [...jobsPerHost.keys()]);

  const queuedJobs = await Promise.all(
    [...queues].map(async ([host, queue]): Promise<HarvestJobInfo[]> => {
      const jobsOfHost = jobsPerHost.get(host) ?? [];

      const queued = await sendHarvestJobsInQueue(queue, jobsOfHost);

      const event = await sendDispatchEvent(channel, queue);

      if (event.error) {
        return queued.map((info) => ({
          error: info.error ?? event.error,
          id: info.id,
        }));
      }

      return queued;
    })
  );

  await channel.close();

  return queuedJobs.flat();
}
