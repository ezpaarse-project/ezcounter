import { EventEmitter } from 'node:events';

import { parseJSONMessage, type rabbitmq } from '@ezcounter/rabbitmq';
import type { Logger } from '@ezcounter/logger';

import { Heartbeat } from '../types';
import { assertTransport } from './utils';

export type HeartbeatListener = EventEmitter<{
  heartbeat: [Heartbeat];
}>;
/**
 * Consume exchange then emit events as it gets messages
 *
 * @param channel - The rabbitmq channel
 * @param logger - The logger
 * @param isRabbitMQMandatory - Is RabbitMQ a mandatory service
 */
export async function listenToHeartbeats(
  channel: rabbitmq.Channel,
  logger: Logger,
  listener: HeartbeatListener,
  isRabbitMQMandatory = false
): Promise<void> {
  const { exchange } = await assertTransport(
    channel,
    logger,
    isRabbitMQMandatory
  );

  const { queue } = await channel.assertQueue('', { exclusive: true });

  await channel.bindQueue(queue, exchange.name, exchange.routingKey);
  await channel.consume(
    queue,
    (msg) => {
      if (!msg) {
        return;
      }

      // Parse message
      const { data, raw, parseError } = parseJSONMessage(msg, Heartbeat);
      if (!data) {
        logger.error({
          msg: 'Invalid data',
          data: process.env.NODE_ENV === 'production' ? undefined : raw,
          err: parseError,
        });
        return;
      }

      listener.emit('heartbeat', data);
    },
    {
      noAck: true,
    }
  );
}

/**
 * Setup heartbeat listener, emitting events whenever a service is sending a heartbeat
 *
 * @param channel - The rabbitmq channel
 * @param logger - The logger
 * @param options - The options
 */
export function setupHeartbeatListener(
  channel: rabbitmq.Channel,
  logger: Logger,
  options?: {
    isRabbitMQMandatory?: boolean;
  }
): HeartbeatListener {
  const listener: HeartbeatListener = new EventEmitter();

  const childLogger = logger.child({ scope: 'heartbeat' });

  listenToHeartbeats(
    channel,
    childLogger,
    listener,
    options?.isRabbitMQMandatory
  );

  return listener;
}
