import type amqp from 'amqplib';
import type { z } from 'zod';

import type { Logger } from '@ezcounter/logger';

import {
  ackMessage,
  consumeQueue,
  rejectMessage,
  sendToExchange,
  sendToQueue,
} from './wrapper';

type JsonConsumerOptions<DataType> = {
  /** The RabbitMQ channel */
  channel: amqp.Channel;
  /** The RabbitMQ queue */
  queue: string;
  /** The logger */
  logger: Logger;
  /** The schema to validate JSON message */
  schema: z.ZodType<DataType>;
  /** Callback to use when valid message is received */
  onMessage: (data: DataType) => void | Promise<void>;
  /** Options to pass to `consume` */
  options?: amqp.Options.Consume;
};

export type JSONMessageTransportQueue = {
  /** Queue to use to send message */
  queue: {
    name: string;
  };
};

export type JSONMessageTransportExchange = {
  /** Exchange to use to send message */
  exchange: {
    name: string;
    routingKey: string;
  };
};

export type JSONMessageTransport<
  TransportType extends
    | JSONMessageTransportQueue
    | JSONMessageTransportExchange,
> = {
  /** Channel used for connection */
  channel: amqp.Channel;
} & TransportType;

/**
 * Shorthand to send data as JSON to a queue or exchange
 *
 * @param transport Transport options
 * @param content The data
 * @param opts The options
 *
 * @returns Information about data
 */
export function sendJSONMessage<DataType>(
  transport: JSONMessageTransport<
    JSONMessageTransportQueue | JSONMessageTransportExchange
  >,
  content: DataType,
  opts?: Omit<amqp.Options.Publish, 'contentType'>
): { sent: boolean; size: number } {
  const options: amqp.Options.Publish = {
    ...opts,
    contentType: 'application/json',
  };

  const buf = Buffer.from(JSON.stringify(content));

  let sent = false;
  if ('queue' in transport) {
    const { name } = transport.queue;
    sent = sendToQueue(transport.channel, name, buf, options);
  }
  if ('exchange' in transport) {
    const { name, routingKey } = transport.exchange;
    sent = sendToExchange(transport.channel, name, routingKey, buf, options);
  }

  return { sent, size: buf.byteLength };
}

/**
 * Shorthand to parse JSON data from a message
 *
 * @param msg The message
 * @param schema The schema
 *
 * @returns The parsed data
 */
export function parseJSONMessage<DataType>(
  msg: amqp.Message,
  schema: z.ZodType<DataType>
): { data?: DataType; raw: unknown; parseError?: z.ZodError<DataType> } {
  const raw: unknown = JSON.parse(msg.content.toString());

  const { error, data } = schema.safeParse(raw);
  return { data, parseError: error, raw };
}

/**
 * Shorthand to consume a queue having JSON messages
 *
 * @param params - Params to setup consumer
 *
 * @returns Promise of RabbitMQ consumer
 */
export function consumeJSONQueue<DataType>(
  params: JsonConsumerOptions<DataType>
): Promise<amqp.Replies.Consume> {
  const { logger, onMessage, options } = params;
  const noAck = options?.noAck === true;

  const handler = async (msg: amqp.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      return;
    }

    // Parse message
    const { data, raw, parseError } = parseJSONMessage(msg, params.schema);
    if (data == null) {
      logger.error({
        data: process.env.NODE_ENV === 'production' ? undefined : raw,
        err: parseError,
        msg: 'Invalid data',
      });
      if (!noAck) {
        rejectMessage(params.channel, msg, false);
      }
      return;
    }

    await onMessage(data);
    if (!noAck) {
      ackMessage(params.channel, msg);
    }
  };

  return consumeQueue(
    params.channel,
    params.queue,
    (msg) => {
      void handler(msg);
    },
    options
  );
}
