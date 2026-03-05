import type amqp from 'amqplib';

export type * from 'amqplib';

/**
 * Closes a RabbitMQ connection
 *
 * @param connection - The RabbitMQ connection
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#model_close
 */
export const closeConnection = (
  connection: amqp.ChannelModel,
  ...args: Parameters<amqp.ChannelModel['close']>
): Promise<void> => connection.close(...args);

/**
 * Create a RabbitMQ channel
 *
 * @param connection - The RabbitMQ connection
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#model_createChannel
 */
export const createChannel = (
  connection: amqp.ChannelModel,
  ...args: Parameters<amqp.ChannelModel['createChannel']>
): Promise<amqp.Channel> => connection.createChannel(...args);

/**
 * Sets the prefetch count
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_prefetch
 */
export async function setPrefetchCount(
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['prefetch']>
): Promise<void> {
  await channel.prefetch(...args);
}

/**
 * Assert a RabbitMQ queue
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue
 */
export const assertQueue = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['assertQueue']>
): Promise<amqp.Replies.AssertQueue> => channel.assertQueue(...args);

/**
 * Send a message to a RabbitMQ queue
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_sendToQueue
 */
export const sendToQueue = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['sendToQueue']>
): boolean => channel.sendToQueue(...args);

/**
 * Consume a RabbitMQ queue
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_consume
 */
export const consumeQueue = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['consume']>
): Promise<amqp.Replies.Consume> => channel.consume(...args);

/**
 * Delete a RabbitMQ queue
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_deleteQueue
 */
export const deleteQueue = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['deleteQueue']>
): Promise<amqp.Replies.DeleteQueue> => channel.deleteQueue(...args);

/**
 * Assert a RabbitMQ exchange
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_assertExchange
 */
export const assertExchange = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['assertExchange']>
): Promise<amqp.Replies.AssertExchange> => channel.assertExchange(...args);

/**
 * Send a message to a RabbitMQ exchange
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_publish
 */
export const sendToExchange = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['publish']>
): boolean => channel.publish(...args);

/**
 * Assert a RabbitMQ exchange
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_bindQueue
 */
export async function bindQueueToExchange(
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['bindQueue']>
): Promise<void> {
  await channel.bindQueue(...args);
}

/**
 * Get a RabbitMQ message
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_get
 */
export const getMessage = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['get']>
): Promise<amqp.GetMessage | false> => channel.get(...args);

/**
 * Acknowledge a RabbitMQ message
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_ack
 */
export const ackMessage = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['ack']>
): void => channel.ack(...args);

/**
 * Reject a RabbitMQ message
 *
 * @param channel - The RabbitMQ channel
 *
 * @see https://amqp-node.github.io/amqplib/channel_api.html#channel_reject
 */
export const rejectMessage = (
  channel: amqp.Channel,
  ...args: Parameters<amqp.Channel['reject']>
): void => channel.reject(...args);
