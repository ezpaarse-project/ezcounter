import { DataHostRefreshData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { createPublisher, rabbitClient, type rabbitmq } from '~/lib/rabbitmq';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';
import { getDataHostWithSupportedData } from '~/models/data-host';
import { refreshSupportedReportsOfDataHost } from '~/models/data-host/refresh';

const logger = appLogger.child({ scope: 'queues' });

// Publisher creating required exchanges/queues
const pub = createPublisher({
  options: {
    confirm: true,
  },
});

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
 * @param channel - The rabbitmq channel
 * @param msg - The message
 * @param queueName - The name of the queue (used to delay jobs)
 */
async function processDataHostRefresh(
  channel: rabbitmq.Channel,
  msg: rabbitmq.SyncMessage,
  queueName: string
): Promise<void> {
  // Parse message
  let data = null;
  try {
    data = DataHostRefreshData.parse(msg.body);
  } catch (error) {
    logger.error({
      data: process.env.NODE_ENV === 'production' ? undefined : msg.body,
      err: error,
      messageId: msg.messageId,
      msg: 'Message have invalid data',
    });
    channel.basicNack({ deliveryTag: msg.deliveryTag, requeue: false });
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

  channel.basicAck({ deliveryTag: msg.deliveryTag });
}

/**
 * Delete queue
 *
 * @param channel - The rabbitmq channel
 * @param queue - The name of the queue
 */
async function deleteHarvestQueue(
  channel: rabbitmq.Channel,
  queue: string
): Promise<void> {
  try {
    // Delete queue - ifEmpty will close channel if there's still jobs
    await channel.queueDelete({ ifEmpty: true, queue });

    logger.debug({
      msg: 'Refresh queue deleted',
      queue,
    });
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
 * Process all messages in refresh queue
 *
 * @param queue - The name of the queue to process
 *
 * @yields After each harvest (or attempt to get harvest)
 *
 * @returns When all messages are processed
 */
export async function* processRefreshQueue(queue: string): AsyncGenerator {
  const channel = await rabbitClient.acquire();
  await channel.queueDeclare({ durable: false, queue });

  logger.info({
    msg: 'Processing data host refresh queue',
    queue,
  });

  // oxlint-disable no-await-in-loop
  while (true) {
    // Get last message
    const msg = await channel.basicGet({ queue });
    if (!msg) {
      break;
    }

    await processDataHostRefresh(channel, msg, queue);
    yield;
  }
  // oxlint-enable no-await-in-loop

  // There was no message left in queue
  await deleteHarvestQueue(channel, queue);
  await channel.close();
}

/**
 * Queue data host refresh
 *
 * @param queue - The name of the queue
 * @param data - The request to queue
 */
export async function queueDataHostRefresh(
  queue: string,
  data: DataHostRefreshData
): Promise<void> {
  try {
    await pub.send(
      {
        messageId: data.id,
        routingKey: queue,
      },
      data
    );

    logger.trace({
      msg: 'Data host refresh sent',
      queue,
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to send data host refresh',
      queue,
    });
  }
}
