import type { rabbitmq } from '@ezcounter/rabbitmq';
import { setupHeartbeat } from '@ezcounter/heartbeats';
import type {
  HeartbeatService,
  HeartbeatSender,
} from '@ezcounter/heartbeats/types';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { version } from '~/../package.json' with { type: 'json' };

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  name: 'harvester',
  version,
  filesystems: {
    logs: config.log.dir,
    download: config.download.dir,
  },
};

let heartbeat: HeartbeatSender | undefined;

export { getMissingMandatoryServices } from '@ezcounter/heartbeats';

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

  heartbeat = setupHeartbeat(channel, service, logger, true, frequency);

  heartbeat.send();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
