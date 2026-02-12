import { hostname } from 'node:os';

import { isBefore } from 'date-fns';

import type { rabbitmq } from '@ezcounter/rabbitmq';
import { setupHeartbeat, listenToHeartbeats } from '@ezcounter/heartbeats';
import type {
  HeartbeatService,
  HeartbeatSender,
} from '@ezcounter/heartbeats/types';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type { Heartbeat } from '~/models/heartbeat/types';

import { version } from '~/../package.json' with { type: 'json' };

const { heartbeat: frequency } = config;

const logger = appLogger.child({ scope: 'heartbeat' });

const nodeId = `${hostname()}:${process.pid}`;
export const service: HeartbeatService = {
  name: 'api',
  version,
  filesystems: {
    logs: config.log.dir,
  },
};

const services = new Map<string, Heartbeat>();
let heartbeat: HeartbeatSender | undefined;

export { getMissingMandatoryServices } from '@ezcounter/heartbeats';

/**
 * Init Heartbeats listener to track which services are up
 *
 * @param channel - The RabbitMQ channel
 */
function initHeartbeatListener(channel: rabbitmq.Channel): void {
  listenToHeartbeats(channel, logger, function onHeartbeat(beat) {
    // If it's the same machine, then we can consider RabbitMQ as working
    if (beat.hostname === nodeId) {
      const now = new Date();

      const { cluster_name, version } = channel.connection.serverProperties;

      onHeartbeat({
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
  });
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

  heartbeat = setupHeartbeat(channel, service, logger, true, frequency);
  initHeartbeatListener(channel);

  heartbeat.send();

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
