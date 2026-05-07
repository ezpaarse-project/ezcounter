import { createHash, randomUUID } from 'node:crypto';

import type { HarvestAuthOptions } from '@ezcounter/dto/harvest';
import { HarvestRequestData } from '@ezcounter/dto/queues';
import { waitForGenerator } from '@ezcounter/toolbox/utils';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { createConsumer, createPublisher, rabbitClient } from '~/lib/rabbitmq';

import type { DataHostSupportedRelease } from '~/models/data-host/dto';
import { findAllReleasesSupportedByDataHost } from '~/models/data-host';
import { createManyHarvestJob, failManyHarvestJob } from '~/models/harvest';
import { prepareHarvestJobsFromHarvestRequest } from '~/models/harvest/prepare';

import {
  processRefreshQueue,
  queueDataHostRefresh,
} from '../data-host/refresh';
import { queueHarvestJobs } from './dispatch';

const config = appConfig.dataHost.supported;

const QUEUE_NAME = 'ezcounter:harvest.request';
const HOST_QUEUE_NAME_HASH_LENGTH = 16;

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    queues: [{ durable: false, queue: QUEUE_NAME }],
  },
});

/**
 * Get queue name for a data host
 *
 * @param dataHost - The data host
 *
 * @returns The name of the queue
 */
function getDataHostQueueName(dataHost: { baseUrl: string }): string {
  const hash = createHash('sha1')
    .update(new URL(dataHost.baseUrl).hostname)
    .digest('hex')
    .slice(0, HOST_QUEUE_NAME_HASH_LENGTH);

  return `ezcounter:data-host.refresh:${hash}`;
}

/**
 * Shorthand to get the supported release from the list of supported releases
 *
 * @param supportedReleases - The list of supported releases
 * @param release - The release to get
 *
 * @returns The supported release or null if not found
 */
const getSupportedRelease = (
  supportedReleases: DataHostSupportedRelease[],
  release: '5' | '5.1'
): DataHostSupportedRelease | null =>
  supportedReleases.find((item) => item.release === release) || null;

/**
 * Queue all data hosts refresh
 *
 * @param request - The harvest request
 *
 * @returns The list of queued jobs
 */
async function queueAllDataHostRefresh(
  request: HarvestRequestData
): Promise<string[]> {
  const toRefresh = new Map<string, Map<'5' | '5.1', HarvestAuthOptions[]>>();
  for (const { download } of request) {
    let hostData = toRefresh.get(download.dataHost.id);
    if (!hostData) {
      hostData = new Map();
    }

    const releases = new Set(download.reports.map(({ release }) => release));
    for (const release of releases) {
      hostData.set(release, [
        ...(hostData.get(release) ?? []),
        download.dataHost.auth,
      ]);
    }
    toRefresh.set(download.dataHost.id, hostData);
  }

  const channel = await rabbitClient.acquire();
  const queues = new Set<string>();
  // Queue data hosts refresh
  await Promise.all(
    [...toRefresh].map(async ([id, options]) => {
      const supportedReleases = await findAllReleasesSupportedByDataHost(id);

      for (const [release, auths] of options) {
        const supported = getSupportedRelease(supportedReleases, release);
        if (supported) {
          const queue = getDataHostQueueName(supported);
          if (!queues.has(queue)) {
            // oxlint-disable-next-line no-await-in-loop
            await channel.queueDeclare({ durable: false, queue });
            queues.add(queue);
          }
          // oxlint-disable-next-line no-await-in-loop
          await queueDataHostRefresh(queue, {
            dataHost: { auths, id },
            id: randomUUID(),
            release,
          });
        }
      }
    })
  );

  await channel.close();
  return [...queues];
}

/**
 * Process Harvest request
 *
 * @param data - The harvest request to process
 */
export async function onHarvestRequest(
  data: HarvestRequestData
): Promise<void> {
  try {
    const queues = await queueAllDataHostRefresh(data);

    // Wait for all refresh to be done
    await Promise.all(
      queues.map((queueName) =>
        waitForGenerator(
          processRefreshQueue(queueName),
          // Just a little delay to avoid spamming too fast
          config.refreshJobDelay
        )
      )
    );

    // Create harvest jobs from request
    const jobs = await prepareHarvestJobsFromHarvestRequest(data);
    await createManyHarvestJob(jobs);
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
 */
export async function queueHarvestRequest(
  data: HarvestRequestData
): Promise<void> {
  try {
    await pub.send({ routingKey: QUEUE_NAME }, data);
    logger.trace('Harvest request queued');
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to queue harvest request',
    });
  }
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
      queueOptions: { durable: false },
    },
    schema: HarvestRequestData,
  });

  sub.on('ready', () => {
    logger.debug('Harvest request consumer ready');
  });
}
