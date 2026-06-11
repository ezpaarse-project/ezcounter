import type {
  HeartbeatSender,
  HeartbeatService,
} from '@ezcounter/heartbeats/dto';
import { setupHeartbeat } from '@ezcounter/heartbeats';

import { appConfig } from '~/lib/config';
import { access, constants as fsConstants, mkdir } from '~/lib/fs';
import { appLogger } from '~/lib/logger';
import { rabbitClient } from '~/lib/rabbitmq';

// oxlint-disable-next-line import/extensions
import { version } from '~/../package.json' with { type: 'json' };

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  filesystems: {
    downloads: appConfig.download.dir,
    logs: appConfig.log.dir,
    temp: appConfig.temp.dir,
  },
  name: 'harvester',
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
  // Downloads dir - Used to cache downloaded reports
  await mkdir(appConfig.download.dir, { recursive: true });
  await access(appConfig.download.dir, fsConstants.W_OK);

  // Temp dir - Used for validate reports
  await mkdir(appConfig.temp.dir, { recursive: true });
  await access(appConfig.temp.dir, fsConstants.W_OK);

  // Log dir - Used for writing logs
  if (appConfig.log.dir) {
    await mkdir(appConfig.log.dir, { recursive: true });
    await access(appConfig.log.dir, fsConstants.W_OK);
  }
}
