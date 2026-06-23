import {
  type EnvOfConfig,
  defineBoolean,
  defineDuration,
  defineJSON,
  defineNumber,
  defineString,
} from '@ezcounter/config/env';

import type defaultConfig from './default.json';

const envDefinition: EnvOfConfig<typeof defaultConfig> = {
  /**
   * Port that HTTP server will listen
   */
  port: defineNumber('HTTP_PORT'),
  /** Heartbeat configuration */
  heartbeat: {
    /**
     * Frequency for self reporting
     */
    self: defineNumber('HEARTBEAT_FREQUENCY'),
    /**
     * Frequency for reporting connected services
     *
     * Will use a dynamic frequency, defaulting to default when connection is lost
     */
    connected: {
      min: defineNumber('HEARTBEAT_EXTERNAL_FREQUENCY_MIN'),
      max: defineNumber('HEARTBEAT_EXTERNAL_FREQUENCY_MAX'),
    },
  },
  /** Log configuration */
  log: {
    /**
     * Minimum level to write
     *
     * Available levels: trace, debug, info, warn, fatal
     */
    level: defineString('LOG_LEVEL'),
    /**
     * Directory to output logs, won't write logs to disk if left empty
     *
     * Will still output logs to stdout
     */
    dir: defineString('LOG_DIR'),
    /**
     * Keys to ignore in logs
     */
    ignore: defineJSON('LOG_IGNORE'),
  },
  /** RabbitMQ configuration */
  rabbitmq: {
    url: defineString('RABBITMQ_URL'),
    username: defineString('RABBITMQ_USERNAME'),
    password: defineString('RABBITMQ_PASSWORD'),
  },
  /** ElasticSearch configuration */
  elasticsearch: {
    username: defineString('ELASTIC_USERNAME'),
    password: defineString('ELASTIC_PASSWORD'),
    apiKey: defineString('ELASTIC_API_KEY'),
    nodes: defineJSON('ELASTIC_NODES'),
  },
  /** Redis configuration */
  redis: {
    url: defineString('REDIS_URL'),
    username: defineString('REDIS_USERNAME'),
    password: defineString('REDIS_PASSWORD'),
  },
  /** Enrich items options */
  enrich: {
    /** Enrich sources configuration */
    sources: {
      /** EzUnpaywall configuration */
      ezunpaywall: {
        baseUrl: defineString('EZUNPAYWALL_BASE_URL'),
        apiKey: defineString('EZUNPAYWALL_API_KEY'),
        /**
         * Retry configuration
         */
        retry: defineNumber('EZUNPAYWALL_RETRY'),
        retryDelay: defineDuration('EZUNPAYWALL_RETRY_DELAY', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        /**
         * Timeout of the request
         */
        timeout: defineDuration('EZUNPAYWALL_TIMEOUT', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        /**
         * How long the data fetched will be stored in Redis
         */
        storeTtl: defineDuration('EZUNPAYWALL_STORE_TTL', [
          'months',
          'weeks',
          'days',
          'hours',
          'minutes',
        ]),
      },
      /** OpenAlex configuration */
      openalex: {
        baseUrl: defineString('OPENALEX_BASE_URL'),
        apiKey: defineString('OPENALEX_API_KEY'),
        /**
         * Is `baseUrl` leading to the CNRS Gateway around OpenAlex
         */
        isCNRSGateway: defineBoolean('OPENALEX_IS_CNRS_GATEWAY'),
        /**
         * Retry configuration
         */
        retry: defineNumber('OPENALEX_RETRY'),
        retryDelay: defineDuration('OPENALEX_RETRY_DELAY', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        /**
         * Timeout of the request
         */
        timeout: defineDuration('OPENALEX_TIMEOUT', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        /**
         * How long the data fetched will be stored in Redis
         */
        storeTtl: defineDuration('OPENALEX_STORE_TTL', [
          'months',
          'weeks',
          'days',
          'hours',
          'minutes',
        ]),
      },
    },
  },
};

export default envDefinition;
