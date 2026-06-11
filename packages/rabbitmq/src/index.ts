import {
  type AsyncMessage,
  Connection,
  type Consumer,
  type ConsumerProps,
  ConsumerStatus,
  type Envelope,
  type Publisher,
  type PublisherProps,
  type RPCClient,
  type RPCProps,
} from 'rabbitmq-client';

import type { z } from '@ezcounter/dto';
import type { Logger } from '@ezcounter/logger';

type RabbitMqConfig = {
  url: string;
  username: string;
  password: string;
};

const channels: (Consumer | Publisher | RPCClient)[] = [];

export type MessageMeta = Omit<AsyncMessage, 'body'>;

/**
 * Type for reply callback
 */
export type Reply<ResponseType> = (
  body: ResponseType,
  envelope?: Envelope
) => Promise<void>;

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
  const url = new URL(config.url);
  url.username = config.username;
  url.password = config.password;

  const client = new Connection(url.href);

  const onShutdown = async (): Promise<void> => {
    await Promise.all(channels.map((sub) => sub.close()));
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
export type CreateConsumerProps<MessageType, ResponseType = never> = {
  /** The schema to validate message */
  schema: z.ZodType<MessageType>;
  /** The logger */
  logger: Logger;
  /** Handler to use when valid message is received */
  onMessage: (
    data: MessageType,
    meta: MessageMeta,
    reply: Reply<ResponseType>
  ) => void | Promise<void>;
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
export function createRabbitConsumer<DataType, ResponseType = never>(
  client: Connection,
  props: CreateConsumerProps<DataType, ResponseType>
): Consumer {
  const sub = client.createConsumer(props.options, async (msg, reply) => {
    const { body, ...meta } = msg;

    // Parse message
    let data = null;
    try {
      data = props.schema.parse(body);
    } catch (error) {
      props.logger.error({
        data: process.env.NODE_ENV === 'production' ? undefined : body,
        err: error,
        messageId: meta.messageId,
        msg: 'Message have invalid data',
      });

      return props.options.noAck ? undefined : ConsumerStatus.DROP;
    }

    // Call handler
    await props.onMessage(data, meta, reply);
    return props.options.noAck ? undefined : ConsumerStatus.ACK;
  });

  sub.on('error', (err) => {
    props.logger.error({
      err,
      msg: 'Failed to consume queue',
      options: props.options,
    });
  });

  channels.push(sub);
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

  channels.push(pub);
  return pub;
}

/**
 * Type for props used when creating a RPC Server
 *
 * @alias `CreateConsumerProps` - For consistency with the RPC client
 */
export type CreateRPCServerProps<DataType, ResponseType> = CreateConsumerProps<
  DataType,
  ResponseType
>;

/**
 * Shorthand to serve a RPC method
 *
 * @alias `createRabbitConsumer` - For consistency with the RPC client and better typing
 *
 * @param client - The RabbitMQ client
 * @param props - Params to setup server
 *
 * @returns The RabbitMQ consumer
 */
export const createRabbitRPCServer = <DataType, ResponseType>(
  client: Connection,
  props: CreateRPCServerProps<DataType, ResponseType>
): Consumer => createRabbitConsumer(client, props);

/**
 * Type for props used when creating a RPC Client
 */
export type CreateRPCClientProps = {
  /** Options to pass to `createRPCClient` */
  options?: RPCProps;
};

/**
 * Shorthand to publish RPC requests
 *
 * @param client - The RabbitMQ client
 * @param props - Params to setup client
 *
 * @returns The RabbitMQ RPC Client
 */
export function createRabbitRPCClient(
  client: Connection,
  props: CreateRPCClientProps
): RPCClient {
  const rpcClient = client.createRPCClient(props.options);

  channels.push(rpcClient);
  return rpcClient;
}

export type * as rabbitmq from 'rabbitmq-client';
