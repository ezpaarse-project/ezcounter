import type { z } from 'zod';
import {
  Connection,
  type Consumer,
  type ConsumerProps,
  ConsumerStatus,
  type Envelope,
  type MessageBody,
  type Publisher,
  type PublisherProps,
} from 'rabbitmq-client';

import type { Logger } from '@ezcounter/logger';

type RabbitMqConfig = {
  protocol: string;
  host: string;
  port: number;
  vhost: string;
  username: string;
  password: string;
};

const consumers: Consumer[] = [];
const publishers: Publisher[] = [];

export type Reply = (body: MessageBody, envelope?: Envelope) => Promise<void>;

/**
 * Setup RabbitMQ connection
 *
 * @param logger - Logger instance
 * @param config - RabbitMQ configuration
 *
 * @returns RabbitMQ connection
 */
export function setupRabbitMQ(
  logger: Logger,
  config: RabbitMqConfig
): Connection {
  const client = new Connection({
    hostname: config.host,
    password: config.password,
    port: config.port,
    tls: config.protocol === 'amqps',
    username: config.username,
    vhost: config.vhost,
  });

  const onShutdown = async (): Promise<void> => {
    await Promise.all(consumers.map((sub) => sub.close()));
    await Promise.all(publishers.map((pub) => pub.close()));
    await client.close();
  };

  client.on('connection', () => {
    logger.info({
      config,
      msg: 'Connected to RabbitMQ',
    });
  });

  client.on('error', (err) => {
    logger.error({ err, msg: 'Failed to connect to RabbitMQ' });
  });

  process.on('SIGINT', onShutdown);
  process.on('SIGTERM', onShutdown);

  return client;
}

/**
 * Type for props used when creating a Consumer
 */
export type CreateConsumerProps<DataType> = {
  /** The schema to validate message */
  schema: z.ZodType<DataType>;
  /** The logger */
  logger: Logger;
  /** Handler to use when valid message is received */
  onMessage: (data: DataType, reply: Reply) => void | Promise<void>;
  /** Options to pass to `createConsumer` */
  options: ConsumerProps;
};

/**
 * Shorthand to consume a queue
 *
 * @param client - The RabbitMQ client
 * @param props - Params to setup consumer
 *
 * @returns The RabbitMQ consumer
 */
export function createRabbitConsumer<DataType>(
  client: Connection,
  props: CreateConsumerProps<DataType>
): Consumer {
  const sub = client.createConsumer(props.options, async (msg, reply) => {
    // Parse message
    let data = null;
    try {
      data = props.schema.parse(msg.body);
    } catch (error) {
      props.logger.error({
        data: process.env.NODE_ENV === 'production' ? undefined : msg.body,
        err: error,
        messageId: msg.messageId,
        msg: 'Message have invalid data',
      });

      return props.options.noAck ? undefined : ConsumerStatus.DROP;
    }

    // Call handler
    await props.onMessage(data, reply);
    return props.options.noAck ? undefined : ConsumerStatus.ACK;
  });

  sub.on('error', (err) => {
    props.logger.error({
      err,
      msg: 'Failed to consume queue',
      options: props.options,
    });
  });

  consumers.push(sub);
  return sub;
}

/**
 * Type for props used when creating a Publisher
 */
export type CreatePublisherProps = {
  /** Options to pass to `createConsumer` */
  options?: PublisherProps;
};

/**
 * Shorthand to publish message
 *
 * @param client - The RabbitMQ client
 * @param props - Params to setup publisher
 *
 * @returns The RabbitMQ publisher
 */
export function createRabbitPublisher(
  client: Connection,
  props: CreatePublisherProps
): Publisher {
  const pub = client.createPublisher(props.options);

  publishers.push(pub);
  return pub;
}

export type * as rabbitmq from 'rabbitmq-client';
