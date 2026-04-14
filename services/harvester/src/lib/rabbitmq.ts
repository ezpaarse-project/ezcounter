import {
  type CreateConsumerProps,
  type CreatePublisherProps,
  createRabbitConsumer,
  createRabbitPublisher,
  type rabbitmq,
  setupRabbitMQ,
} from '@ezcounter/rabbitmq';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { rabbitmq: rmqConfig } = config;

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

/**
 * The RabbitMQ client
 */
export const rabbitClient = setupRabbitMQ(logger, rmqConfig);

/**
 * Create a RabbitMQ consumer
 *
 * @param props - The consumer properties
 *
 * @returns The consumer
 */
export const createConsumer = <DataType>(
  props: CreateConsumerProps<DataType>
): rabbitmq.Consumer => createRabbitConsumer(rabbitClient, props);

/**
 * Create a RabbitMQ publisher
 *
 * @param props - The publisher properties
 *
 * @returns The publisher
 */
export const createPublisher = (
  props: CreatePublisherProps
): rabbitmq.Publisher => createRabbitPublisher(rabbitClient, props);

export type { rabbitmq };
