import { EventEmitter } from 'node:events';

import type { Logger } from '@ezcounter/logger';
import { createRabbitPublisher, type rabbitmq } from '@ezcounter/rabbitmq';

import type {
  HeartbeatService as CreateHeartbeatService,
  Heartbeat,
  HeartbeatFrequency,
} from '../common/dto';
import type { HeartbeatSender } from './dto';
import { EXCHANGE_NAME } from '../common';
import { mandatoryServices } from '../mandatory';
import { HeartbeatService } from './service';

/**
 * Shorthand to send heartbeat
 *
 * @param pub - RabbitMQ publisher
 * @param beat - Heartbeat to send
 * @param logger - Logger
 */
async function sendBeat(
  pub: rabbitmq.Publisher,
  beat: Heartbeat,
  logger: Logger
): Promise<void> {
  try {
    await pub.send({ exchange: EXCHANGE_NAME }, beat);
    logger.trace({
      msg: 'Heartbeat sent',
      service: beat.service,
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to send heartbeat',
      service: beat.service,
    });
  }
}

/**
 * Setup events to send heartbeat
 *
 * @param service - Heartbeat service
 * @param pub - RabbitMQ publisher
 * @param logger - Logger
 *
 * @returns The event emitter
 */
function setupEventListener(
  service: HeartbeatService,
  pub: rabbitmq.Publisher,
  logger: Logger
): HeartbeatSender {
  const sender: HeartbeatSender = new EventEmitter();

  sender.on('send:main', async () => {
    const beat = await service.getHeartbeat();
    await sendBeat(pub, beat, logger);
  });

  sender.on('send:connected', async (key) => {
    const connected = service.connectedServices.get(key);
    if (!connected) {
      throw new Error(`The service ${key} doesn't exists`);
    }

    try {
      const beat = await connected.getHeartbeat();
      await sendBeat(pub, beat, logger);
    } catch (error) {
      logger.error({
        err: error,
        msg: 'Error when getting connected service',
        service: key,
        timeout: connected.frequency.last * 0.75,
      });
    }
  });

  sender.on('send', () => {
    sender.emit('send:main');

    for (const [key] of service.connectedServices) {
      sender.emit('send:connected', key);
    }
  });

  return sender;
}

/**
 * Setup the intervals to send the heartbeats
 *
 * @param service - The heartbeat service
 * @param sender - The heartbeat sender
 */
function setupIntervals(
  service: HeartbeatService,
  sender: HeartbeatSender
): void {
  service.scheduleNext(function mainInterval() {
    sender.emit('send:main');

    service.scheduleNext(mainInterval);
  });

  for (const [key, connected] of service.connectedServices) {
    connected.scheduleNext(function connectedInterval() {
      sender.emit('send:connected', key);

      connected.scheduleNext(connectedInterval);
    });
  }
}

/**
 * Setup heartbeats for this service
 *
 * @param rabbitClient - The rabbitmq client
 * @param logger - The logger
 * @param options - Options to setup heartbeat
 *
 * @returns The heartbeat sender
 */
export function setupHeartbeatSender(
  rabbitClient: rabbitmq.Connection,
  logger: Logger,
  options: {
    service: CreateHeartbeatService;
    isRabbitMQMandatory?: boolean;
    frequency?: HeartbeatFrequency;
  }
): HeartbeatSender {
  const service = new HeartbeatService(options.service, options.frequency);

  const pub = createRabbitPublisher(rabbitClient, {
    options: {
      exchanges: [{ durable: false, exchange: EXCHANGE_NAME, type: 'fanout' }],
    },
  });

  const sender = setupEventListener(service, pub, logger);
  setupIntervals(service, sender);

  if (options.isRabbitMQMandatory) {
    mandatoryServices.set('rabbitmq', true);
  }

  return sender;
}
