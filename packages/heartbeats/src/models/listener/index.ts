import { EventEmitter } from 'node:events';

import type { Logger } from '@ezcounter/logger';
import { createRabbitConsumer, type rabbitmq } from '@ezcounter/rabbitmq';

import type { HeartbeatListener } from './dto';
import { EXCHANGE_NAME } from '../common';
import { Heartbeat } from '../common/dto';

/**
 * Setup heartbeat listener, emitting events whenever a service is sending a heartbeat
 *
 * @param rabbitClient - The rabbitmq client
 * @param logger - The logger
 *
 * @returns The listener
 */
export function setupHeartbeatListener(
  rabbitClient: rabbitmq.Connection,
  logger: Logger
): HeartbeatListener {
  const listener: HeartbeatListener = new EventEmitter();

  createRabbitConsumer(rabbitClient, {
    logger,
    onMessage: (data) => {
      listener.emit('heartbeat', data);
    },
    options: {
      exchanges: [{ exchange: EXCHANGE_NAME, type: 'fanout' }],
      noAck: true,
      queueBindings: [{ exchange: EXCHANGE_NAME }],
      queueOptions: { durable: false, exclusive: true },
    },
    schema: Heartbeat,
  });

  return listener;
}
