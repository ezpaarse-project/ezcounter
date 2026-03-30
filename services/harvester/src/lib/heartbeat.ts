import type {
  HeartbeatSender,
  HeartbeatService,
} from '@ezcounter/heartbeats/dto';
import type { rabbitmq } from '@ezcounter/rabbitmq';
import { setupHeartbeat } from '@ezcounter/heartbeats';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import { version } from '~/../package.json' with { type: 'json' };

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const service: HeartbeatService = {
  filesystems: {
    download: config.download.dir,
    logs: config.log.dir,
  },
  name: 'harvester',
  version,
};

let heartbeat: HeartbeatSender | null = null;

export { getMissingMandatoryServices } from '@ezcounter/heartbeats';

/**
 *
 * Init Heartbeats - emitting events as long that service is alive
 * @param connection - The RabbitMQ connection
 */
export async function initHeartbeat(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const start = process.uptime();

  const channel = await connection.createChannel();
  logger.debug('Channel created');

  heartbeat = await setupHeartbeat(channel, logger, {
    frequency,
    isRabbitMQMandatory: false,
    service,
  });

  heartbeat.emit('send');

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
