import { setTimeout } from 'node:timers/promises';

import amqp from 'amqplib';

import type { Logger } from '@ezcounter/logger';

import { closeConnection } from './wrapper';

export * as rabbitmq from './wrapper';
export * from './json-messages';

/**
 * Attempts to connect to RabbitMQ, reconnecting on failure
 *
 * @param connectOpts Options to connect to rabbitmq
 * @param logger Logger
 *
 * @returns RabbitMQ connection
 */
async function connectToRabbitMQ(
  connectOpts: amqp.Options.Connect,
  logger: Logger
): Promise<amqp.ChannelModel> {
  try {
    const connection = await amqp.connect(connectOpts);

    logger.info({
      msg: 'Connected to RabbitMQ',
      config: connectOpts,
    });

    return connection;
  } catch (err) {
    logger.error({ msg: 'Failed to connect to RabbitMQ', err });
    await setTimeout(5000);
    return connectToRabbitMQ(connectOpts, logger);
  }
}

/**
 * Initialize RabbitMQ connection
 *
 * @param connectOpts - The options to connect to RabbitMQ
 * @param useRabbitMQ - The callback to use the RabbitMQ connection
 * @param logger - The logger
 */
export function setupRabbitMQ(
  connectOpts: amqp.Options.Connect,
  useRabbitMQ: (connection: amqp.ChannelModel) => Promise<void>,
  logger: Logger
): Promise<void> {
  // Used to prevent re-connection while stopping
  let stopping = false;

  /**
   * Setup graceful shutdown and automatic re-connection
   */
  const init = async (): Promise<void> => {
    const connection = await connectToRabbitMQ(connectOpts, logger);
    stopping = false;

    /**
     * Gracefully close connection
     */
    const gracefullyStop = async (): Promise<void> => {
      stopping = true;
      try {
        await closeConnection(connection);
        logger.debug('Connection closed');
      } catch (err) {
        logger.error({ msg: 'Failed to close connection', err });
      }
    };

    process.on('SIGTERM', gracefullyStop);

    connection.on('close', () => {
      if (stopping) {
        return;
      }

      // Prevent stopping multiple times
      process.off('SIGTERM', gracefullyStop);

      // Reconnect and re-run callback
      logger.debug('Reconnecting to RabbitMQ');
      init();
    });

    await useRabbitMQ(connection);
  };

  return init();
}
