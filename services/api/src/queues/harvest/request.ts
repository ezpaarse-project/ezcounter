import { createHash, randomUUID } from 'node:crypto';

import type { HarvestAuthOptions } from '@ezcounter/dto/harvest';
import { HarvestRequestData } from '@ezcounter/dto/queues';
import {
  consumeJSONQueue,
  rabbitmq,
  sendJSONMessage,
} from '@ezcounter/rabbitmq';
import { waitForGenerator } from '@ezcounter/toolbox/utils';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type { DataHostSupportedRelease } from '~/models/data-host/dto';
import { findAllReleasesSupportedByDataHost } from '~/models/data-host';
import { createManyHarvestJob, failManyHarvestJob } from '~/models/harvest';
import { prepareHarvestJobsFromHarvestRequest } from '~/models/harvest/prepare';

import {
  processRefreshQueue,
  queueDataHostRefresh,
} from '../data-host/refresh';
import { queueHarvestJobs } from './dispatch';

const QUEUE_NAME = 'ezcounter:harvest.request';
const HOST_QUEUE_NAME_HASH_LENGTH = 16;

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'queues' });

// We need a global channel to avoid passing it every time we send an event
let channel: rabbitmq.Channel | null = null;

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

  const queues = new Set<string>();
  // Queue data hosts refresh
  await Promise.all(
    [...toRefresh].map(async ([id, options]) => {
      const supportedReleases = await findAllReleasesSupportedByDataHost(id);

      for (const [release, auths] of options) {
        const supported = getSupportedRelease(supportedReleases, release);
        if (supported) {
          const queueName = getDataHostQueueName(supported);
          if (!queues.has(queueName)) {
            // oxlint-disable-next-line no-await-in-loop
            await rabbitmq.assertQueue(channel!, queueName, { durable: false });
            queues.add(queueName);
          }

          queueDataHostRefresh(queueName, {
            dataHost: { auths, id },
            id: randomUUID(),
            release,
          });
        }
      }
    })
  );

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
          config.dataHost.supported.refreshJobDelay
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
export function queueHarvestRequest(data: HarvestRequestData): void {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  try {
    const { size } = sendJSONMessage(
      { channel, queue: { name: QUEUE_NAME } },
      data
    );
    logger.trace({
      msg: 'Harvest request sent',
      size,
      sizeUnit: 'B',
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to send harvest request',
    });
  }
}

/**
 * Assert queue used to send a harvest request
 *
 * @param chan - The RabbitMQ channel
 */
export async function getHarvestRequestQueue(
  chan: rabbitmq.Channel
): Promise<void> {
  channel = chan;

  await rabbitmq.assertQueue(chan, QUEUE_NAME, { durable: false });

  await consumeJSONQueue({
    channel,
    logger,
    onMessage: (data) => onHarvestRequest(data),
    queue: QUEUE_NAME,
    schema: HarvestRequestData,
  });

  logger.debug('Harvest request queue created');
}
