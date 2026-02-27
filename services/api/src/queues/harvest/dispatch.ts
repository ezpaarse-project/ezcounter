import { createHash } from 'node:crypto';

import type { HarvestError } from '@ezcounter/models/harvest';
import { asHarvestError } from '@ezcounter/models/lib/harvest';
import { sendJSONMessage, type rabbitmq } from '@ezcounter/rabbitmq';
import type {
  HarvestDispatchData,
  HarvestJobData,
} from '@ezcounter/models/queues';

import { appLogger } from '~/lib/logger';

const QUEUE_NAME = 'ezcounter.harvest:dispatch';

const logger = appLogger.child({ scope: 'queues', queue: QUEUE_NAME });

// We need a global channel to avoid passing it every time we queue something
let channel: rabbitmq.Channel | undefined;

/**
 * Assert exchange used to send events about status of harvest jobs
 *
 * @param chan - The RabbitMQ channel
 */
export async function getHarvestDispatchQueue(
  chan: rabbitmq.Channel
): Promise<void> {
  channel = chan;

  await chan.assertQueue(QUEUE_NAME, { durable: false });
  logger.debug('Harvest queue created');
}

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
  const hash = createHash('sha1').update(host).digest('hex').slice(0, 16);

  return `ezcounter.harvest:job:${hash}`;
}

/**
 * Ensure a list of data host will have their own queues
 *
 * @param hostNames - List of hosts to ensure queues
 *
 * @returns The information about queues
 */
async function ensureDataHostQueues(
  hostNames: string[]
): Promise<Map<string, HarvestQueueInfo>> {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  return new Map<string, HarvestQueueInfo>(
    await Promise.all(
      hostNames.map(async (host): Promise<[string, HarvestQueueInfo]> => {
        const queue = getDataHostQueueName(host);
        try {
          const { consumerCount, messageCount } = await channel!.assertQueue(
            queue,
            {
              durable: false,
              exclusive: true,
            }
          );

          const created = consumerCount > 0 && messageCount > 0;

          return [host, { name: queue, created }];
        } catch (err) {
          logger.error({
            msg: 'Failed to assert harvest queues',
            err,
          });

          const error = asHarvestError(err);
          return [host, { name: queue, created: false, error }];
        }
      })
    )
  );
}

/**
 * Send harvest jobs into queues
 *
 * @param queue - Name of queue
 * @param jobs - Jobs to queue
 *
 * @returns Information about jobs
 */
function sendHarvestJobsInQueue(
  queue: HarvestQueueInfo,
  jobs: HarvestJobData[]
): HarvestJobInfo[] {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  return jobs.map((job) => {
    if (queue.error) {
      return { id: job.id, error: queue.error };
    }

    try {
      const { size } = sendJSONMessage(
        { channel: channel!, queue: { name: queue.name } },
        job
      );

      logger.trace({
        msg: 'Queued harvest job',
        size,
        sizeUnit: 'B',
      });

      return { id: job.id };
    } catch (err) {
      logger.error({
        msg: 'Failed to queue harvest job',
        err,
      });

      const error = asHarvestError(err);
      return { id: job.id, error };
    }
  });
}

/**
 * Send dispatch events
 */
async function sendDispatchEvent(
  queue: HarvestQueueInfo
): Promise<HarvestDispatchInfo> {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  if (!queue.created || queue.error) {
    return {};
  }

  try {
    const { size } = sendJSONMessage<HarvestDispatchData>(
      { channel, queue: { name: QUEUE_NAME } },
      { queueName: queue.name }
    );
    logger.trace({
      msg: 'Queued harvest dispatch',
      size,
      sizeUnit: 'B',
    });

    return {};
  } catch (err) {
    logger.error({
      msg: 'Failed to queue harvest dispatch',
      err,
    });

    await channel.deleteQueue(queue.name);

    const error = asHarvestError(err);
    return { error };
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

  // Group jobs per host
  const jobsPerHost = Map.groupBy<string, HarvestJobData>(
    jobs,
    (job) => new URL(job.download.dataHost.baseUrl).hostname
  );

  // Create harvest queues
  const queues = await ensureDataHostQueues([...jobsPerHost.keys()]);

  const queuedJobs = await Promise.all(
    [...queues].map(async ([host, queue]): Promise<HarvestJobInfo[]> => {
      const jobs = jobsPerHost.get(host) ?? [];

      const queued = sendHarvestJobsInQueue(queue, jobs);

      const event = await sendDispatchEvent(queue);

      if (event.error) {
        return queued.map((info) => ({
          id: info.id,
          error: info.error || event.error,
        }));
      }

      return queued;
    })
  );

  return queuedJobs.flat();
}
