import { DataHostRefreshData } from '@ezcounter/dto/queues';
import {
  parseJSONMessage,
  rabbitmq,
  sendJSONMessage,
} from '@ezcounter/rabbitmq';

import { appLogger } from '~/lib/logger';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';
import { getDataHostWithSupportedData } from '~/models/data-host';
import { refreshSupportedReportsOfDataHost } from '~/models/data-host/refresh';

const logger = appLogger.child({ scope: 'queues' });

// We need a global channel to avoid passing it every time we send an event
let channel: rabbitmq.Channel | null = null;

/**
 * Try refresh supported reports using every auth available
 *
 * @param dataHost - Data host to refresh
 * @param data - Data to refresh
 */
async function tryRefreshSupportedReports(
  dataHost: DataHostWithSupportedData,
  data: DataHostRefreshData
): Promise<void> {
  // Dedupe auths
  const auths = [
    ...new Map(
      data.dataHost.auths.map((auth) => [
        `${auth.customer_id}:${auth.requestor_id}:${auth.api_key}`,
        auth,
      ])
    ).values(),
  ];

  for (const auth of auths) {
    try {
      // oxlint-disable-next-line no-await-in-loop - We need to have the result before re-trying
      await refreshSupportedReportsOfDataHost(dataHost, auth, {
        release: data.release,
      });

      // Refresh succeed, no need to try further
      return;
    } catch (error) {
      if (error instanceof Error && error.name === 'FetchError') {
        logger.warn({
          dataHostId: data.dataHost.id,
          err: error,
          id: data.id,
          msg: 'Got error when refreshing supported data of data host',
          release: data.release,
        });
      } else {
        throw error;
      }
    }
  }
}

/**
 * Process DataHost refresh
 *
 * @param msg - The message
 * @param queueName - The name of the queue (used to delay jobs)
 */
async function processDataHostRefresh(
  msg: rabbitmq.GetMessage,
  queueName: string
): Promise<void> {
  // Parse message
  const { data, raw, parseError } = parseJSONMessage(msg, DataHostRefreshData);
  if (!data) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : raw,
      err: parseError,
      msg: 'Invalid data',
      queue: queueName,
    });
    rabbitmq.rejectMessage(channel!, msg, false);
    return;
  }

  try {
    const dataHost = await getDataHostWithSupportedData(data.dataHost.id);
    const supportedRelease = dataHost?.supportedReleases.find(
      ({ release }) => data.release === release
    );
    if (!dataHost || !supportedRelease) {
      return;
    }

    await tryRefreshSupportedReports(dataHost, data);
  } catch (error) {
    logger.error({
      dataHostId: data.dataHost.id,
      err: error,
      id: data.id,
      msg: 'Unable to refresh supported data of data host',
      queue: queueName,
      release: data.release,
    });
  }

  rabbitmq.ackMessage(channel!, msg);
}

/**
 * Delete queue
 *
 * @param channel - The rabbitmq channel
 * @param queueName - The name of the queue
 */
async function deleteHarvestQueue(queueName: string): Promise<void> {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  try {
    // Delete queue - ifEmpty will close channel if there's still jobs
    await rabbitmq.deleteQueue(channel, queueName, {
      ifEmpty: true,
    });

    logger.debug({
      msg: 'Refresh queue deleted',
      queueName,
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to delete queue',
      queueName,
    });
    throw error;
  }
}

/**
 * Process all messages in refresh queue
 *
 * @param channel - The rabbitmq channel
 * @param queueName - The name of the queue to process
 *
 * @yields After each harvest (or attempt to get harvest)
 *
 * @returns When all messages are processed
 */
export async function* processRefreshQueue(queueName: string): AsyncGenerator {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  await rabbitmq.assertQueue(channel, queueName, {
    durable: false,
  });

  logger.info({
    msg: 'Processing data host refresh queue',
    queueName,
  });

  // oxlint-disable no-await-in-loop
  while (true) {
    // Get last message
    const msg = await rabbitmq.getMessage(channel, queueName);
    if (msg) {
      await processDataHostRefresh(msg, queueName);
    } else {
      // There was no message left in queue
      await deleteHarvestQueue(queueName);
      return;
    }

    yield;
  }
  // oxlint-enable no-await-in-loop
}

/**
 * Queue data host refresh
 *
 * @param queueName - The name of the queue
 * @param data - The request to queue
 */
export function queueDataHostRefresh(
  queueName: string,
  data: DataHostRefreshData
): void {
  if (!channel) {
    throw new Error('Channel not initialised');
  }

  try {
    const { size } = sendJSONMessage(
      { channel, queue: { name: queueName } },
      data
    );
    logger.trace({
      msg: 'Data host refresh sent',
      queue: queueName,
      size,
      sizeUnit: 'B',
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to send data host refresh',
      queue: queueName,
    });
  }
}

/**
 * Assert queue used to send a data host refresh
 *
 * @param chan - The RabbitMQ channel
 */
export function getDataHostRefreshQueue(chan: rabbitmq.Channel): void {
  channel = chan;
}
