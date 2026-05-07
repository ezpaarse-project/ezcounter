import { isBefore } from 'date-fns';

import type {
  HeartbeatListener,
  HeartbeatSender,
  HeartbeatService,
} from '@ezcounter/heartbeats/dto';
import {
  listenToHeartbeats,
  mandatoryService,
  setupHeartbeat,
} from '@ezcounter/heartbeats';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { dbPing } from '~/lib/prisma';
import { rabbitClient } from '~/lib/rabbitmq';

import type { Heartbeat } from '~/models/heartbeat/dto';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json' with { type: 'json' };

const logger = appLogger.child({ scope: 'heartbeat' });

const services = new Map<string, Heartbeat>();
let sender: HeartbeatSender | null = null;
let listener: HeartbeatListener | null = null;

export const appService: HeartbeatService = {
  connectedServices: {
    database: mandatoryService('database', dbPing),
  },
  filesystems: {
    logs: appConfig.log.dir,
  },
  name: 'api',
  version: appVersion,
};

export { getMissingMandatoryServices } from '@ezcounter/heartbeats';
/**
 * Init Heartbeats - emitting events as long that service is alive
 */
export function initHeartbeat(): void {
  const start = process.uptime();

  sender = setupHeartbeat(rabbitClient, logger, {
    frequency: appConfig.heartbeat,
    isRabbitMQMandatory: false,
    service: appService,
  });

  listener = listenToHeartbeats(rabbitClient, logger);
  listener.on('heartbeat', (beat) => {
    const { createdAt } = services.get(beat.hostname) ?? {
      createdAt: new Date(),
    };

    services.set(`${beat.hostname}_${beat.service}`, { ...beat, createdAt });
  });

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

  const items = [...services.values()];
  if (rabbitClient.ready) {
    items.push({
      createdAt: now,
      hostname: URL.parse(appConfig.rabbitmq.url)?.hostname || 'rabbitmq',
      nextAt: new Date(now.getTime() + appConfig.heartbeat.self),
      service: 'rabbitmq',
      updatedAt: now,
    });
  }

  return (
    items
      // Filter out services that haven't given heartbeats in time
      .filter((service) => {
        const maxTimestamp =
          service.nextAt.getTime() + appConfig.heartbeat.connected.max;

        return isBefore(now, maxTimestamp);
      })
  );
}
