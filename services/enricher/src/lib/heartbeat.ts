import type {
  HeartbeatSender,
  HeartbeatService,
} from '@ezcounter/heartbeats/dto';
import { mandatoryService, setupHeartbeat } from '@ezcounter/heartbeats';

import { appConfig } from '~/lib/config';
import { esPing } from '~/lib/elasticsearch';
import { redisPing } from '~/lib/keyv/redis';
import { appLogger } from '~/lib/logger';
import { rabbitClient } from '~/lib/rabbitmq';

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
