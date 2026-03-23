import { EventEmitter } from 'node:events';

import type { Logger } from '@ezcounter/logger';
import { consumeJSONQueue, rabbitmq } from '@ezcounter/rabbitmq';

import { Heartbeat } from '../dto';
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

  const { queue } = await rabbitmq.assertQueue(channel, '', {
    exclusive: true,
  });
  await rabbitmq.bindQueueToExchange(
    channel,
    queue,
    exchange.name,
    exchange.routingKey
  );

  await consumeJSONQueue({
    channel,
    queue,
    logger,
    schema: Heartbeat,
    onMessage: (data) => {
      listener.emit('heartbeat', data);
    },
    options: {
      noAck: true,
    },
  });
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
