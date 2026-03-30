import { type rabbitmq, setupRabbitMQ } from '@ezcounter/rabbitmq';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child(
  { scope: 'RabbitMQ' },
  {
    redact: {
      censor: (value) =>
        typeof value === 'string' && ''.padStart(value.length, '*'),
      paths: ['config.password'],
    },
  }
);

const { rabbitmq: rmqConfig } = config;

const connectOpts: rabbitmq.Options.Connect = {
  hostname: rmqConfig.host,
  password: rmqConfig.password,
  port: rmqConfig.port,
  protocol: rmqConfig.protocol,
  username: rmqConfig.username,
  vhost: rmqConfig.vhost,
};

/**
 * Setup a connection to RabbitMQ and run a callback
 *
 * Handles automatic reconnection and graceful shutdown
 *
 * @param setup Init function where rabbitmq connection is passed,
 * will be called on each reconnection
 *
 * @returns When first callback resolves
 */
export const useRabbitMQ = (
  setup: (connection: rabbitmq.ChannelModel) => Promise<void>
): Promise<void> => setupRabbitMQ(connectOpts, setup, logger);
