import {
  type EnvOfConfig,
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
  /** Report downloading options */
  download: {
    /**
     * How many time we should wait before attempting to fetch a data host marked as "processing" (async generation, etc.)
     */
    processingBackoff: defineDuration('DOWNLOAD_PROCESSING_BACKOFF', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    /**
     * How many time we should wait before attempting to fetch a data host marked as "unavaiable" (rate limits, etc.)
     */
    unavailableBackoff: defineDuration('DOWNLOAD_UNAVAILABLE_BACKOFF', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    /**
     * How many time we should wait before detaching harvester from a Harvest Queue
     */
    detachDelay: defineDuration('DOWNLOAD_DETACH_DELAY', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    /**
     * How many time we should wait before processing another Harvest Job
     */
    jobDelay: defineDuration('DOWNLOAD_JOB_DELAY', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    /**
     * Number of tries before aborting a Harvest Job
     */
    maxTries: defineNumber('DOWNLOAD_MAX_TRIES'),
  },
};

export default envDefinition;
