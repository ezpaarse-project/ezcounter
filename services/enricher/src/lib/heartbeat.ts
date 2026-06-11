import { access, constants as fsConstants, mkdir } from 'node:fs/promises';

import type {
  HeartbeatSender,
  HeartbeatService,
} from '@ezcounter/heartbeats/dto';
import { mandatoryService, setupHeartbeat } from '@ezcounter/heartbeats';

import { appConfig } from '~/lib/config';
import { esPing } from '~/lib/elasticsearch';
import { appLogger } from '~/lib/logger';
import { rabbitClient } from '~/lib/rabbitmq';
import { redisPing } from '~/lib/store/redis';

// oxlint-disable-next-line import/extensions
import { version } from '~/../package.json' with { type: 'json' };

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  connectedServices: {
    elastic: mandatoryService('elastic', esPing),
    redis: mandatoryService('redis', redisPing),
  },
  filesystems: {
    logs: appConfig.log.dir,
  },
  name: 'enricher',
  version,
};

let sender: HeartbeatSender | null = null;

export { getMissingMandatoryServices } from '@ezcounter/heartbeats';

/**
 * Init Heartbeats - emitting events as long that service is alive
 */
export function initHeartbeat(): void {
  const start = process.uptime();

  sender = setupHeartbeat(rabbitClient, logger, {
    frequency: appConfig.heartbeat,
    isRabbitMQMandatory: false,
    service,
  });

  sender.emit('send');

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}

/**
 * Assert if service can use filesystems
 */
export async function assertFilesystemsAccess(): Promise<void> {
  // Log dir - Used for writing logs
  if (appConfig.log.dir) {
    await mkdir(appConfig.log.dir, { recursive: true });
    await access(appConfig.log.dir, fsConstants.W_OK);
  }
}
