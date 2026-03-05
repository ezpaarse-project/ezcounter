import { hostname } from 'node:os';

import { isBefore } from 'date-fns';

import type {
  Heartbeat as CommonHeartbeat,
  HeartbeatService,
  HeartbeatSender,
  HeartbeatListener,
} from '@ezcounter/heartbeats/types';
import type { rabbitmq } from '@ezcounter/rabbitmq';
import {
  setupHeartbeat,
  listenToHeartbeats,
  mandatoryService,
} from '@ezcounter/heartbeats';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type { Heartbeat } from '~/models/heartbeat/types';

import { version } from '~/../package.json' with { type: 'json' };

import { dbPing } from './prisma';

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const nodeId = `${hostname()}:${process.pid}`;
export const service: HeartbeatService = {
  name: 'api',
  version,
  filesystems: {
    logs: config.log.dir,
  },
  connectedServices: {
    database: mandatoryService('database', dbPing),
  },
};

const services = new Map<string, Heartbeat>();
let sender: HeartbeatSender | undefined;
let listener: HeartbeatListener | undefined;

export { getMissingMandatoryServices } from '@ezcounter/heartbeats';

function onHeartbeat(channel: rabbitmq.Channel, beat: CommonHeartbeat): void {
  // If it's the same machine, then we can consider RabbitMQ as working
  if (beat.hostname === nodeId) {
    const now = new Date();

    const { cluster_name, version } = channel.connection.serverProperties;

    onHeartbeat(channel, {
      service: 'rabbitmq',
      hostname: cluster_name || 'rabbitmq',
      version: version,
      updatedAt: now,
      nextAt: new Date(now.getTime() + frequency.self),
    });
  }

  const { createdAt } = services.get(beat.hostname) ?? {
    createdAt: new Date(),
  };
  services.set(`${beat.hostname}_${beat.service}`, { ...beat, createdAt });
}

/**
 * Init Heartbeats - emitting events as long that service is alive
 *
 * @param connection - The RabbitMQ connection
 */
export async function initHeartbeat(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  sender = await setupHeartbeat(channel, logger, {
    service,
    frequency,
    isRabbitMQMandatory: false,
  });

  listener = listenToHeartbeats(channel, logger);

  listener.on('heartbeat', (beat) => onHeartbeat(channel, beat));
  sender.emit('send');

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}

/**
 * Get all services that are currently alive
 *
 * @returns services
 */
export function getAllServices(): Heartbeat[] {
  const now = new Date();

  return (
    Array.from(services.values())
      // Filter out services that haven't given heartbeats in time
      .filter((service) => {
        const maxTimestamp = service.nextAt.getTime() + frequency.connected.max;

        return isBefore(now, maxTimestamp);
      })
  );
}
