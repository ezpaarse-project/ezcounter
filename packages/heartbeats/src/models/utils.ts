import type { Logger } from '@ezcounter/logger';
import type {
  rabbitmq,
  JSONMessageTransport,
  JSONMessageTransportExchange,
} from '@ezcounter/rabbitmq';

import type { HeartbeatConnectedServicePing, Heartbeat } from '../types';
import { mandatoryServices } from './mandatory';

/**
 * Execute ping with timeout
 *
 * @param ping - The ping
 * @param frequency - The frequency
 *
 * @returns The heartbeat
 */
export function doPingWithTimeout(
  ping: HeartbeatConnectedServicePing,
  frequency: number
): Promise<Heartbeat> {
  const signal = AbortSignal.timeout(frequency * 0.75);

  // oxlint-disable-next-line promise/avoid-new
  return new Promise<Heartbeat>((resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('TimeoutError'));
    });

    ping()
      // oxlint-disable promise/prefer-await-to-then,promise/prefer-await-to-callbacks
      .then((service) => {
        const now = new Date();
        return {
          ...service,
          updatedAt: now,
          nextAt: new Date(now.getTime() + frequency),
        };
      })
      .then((service) => resolve(service))
      .catch((err) => reject(err));
    // oxlint-enable promise/prefer-await-to-then,promise/prefer-await-to-callbacks
  });
}

export type HeartbeatTransport =
  JSONMessageTransport<JSONMessageTransportExchange>;

/**
 * Assert exchange from rabbitmq Channel
 *
 * @param channel - The rabbitmq channel
 * @param logger - The logger
 *
 * @returns Transport used to send/recieve message
 */
export async function assertTransport(
  channel: rabbitmq.Channel,
  logger: Logger,
  isRabbitMQMandatory = false
): Promise<HeartbeatTransport> {
  try {
    const { exchange } = await channel.assertExchange(
      'ezreeport.heartbeat',
      'fanout',
      { durable: false }
    );

    if (isRabbitMQMandatory) {
      mandatoryServices.set('rabbitmq', true);
    }

    return {
      channel: channel,
      exchange: { name: exchange, routingKey: '' },
    };
  } catch (err) {
    logger.error({ msg: "Couldn't setup heartbeat", err });
    throw err;
  }
}
