import type { Logger } from '@ezcounter/logger';
import {
  type JSONMessageTransport,
  type JSONMessageTransportExchange,
  rabbitmq,
} from '@ezcounter/rabbitmq';

import type { Heartbeat, HeartbeatConnectedServicePing } from '../dto';
import { mandatoryServices } from './mandatory';

const FREQ_MULTIPLIER = 0.75;

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
  const signal = AbortSignal.timeout(frequency * FREQ_MULTIPLIER);

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
          nextAt: new Date(now.getTime() + frequency),
          updatedAt: now,
        };
      })
      .then((service) => {
        resolve(service);
        return service;
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error(`${error}`));
      });
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
 * @param isRabbitMQMandatory - If true, the service will be marked as mandatory
 *
 * @returns Transport used to send/recieve message
 */
export async function assertTransport(
  channel: rabbitmq.Channel,
  logger: Logger,
  isRabbitMQMandatory = false
): Promise<HeartbeatTransport> {
  try {
    const { exchange } = await rabbitmq.assertExchange(
      channel,
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
  } catch (error) {
    logger.error({ err: error, msg: "Couldn't setup heartbeat" });
    throw error;
  }
}
