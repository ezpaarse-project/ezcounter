import {
  type EnvOfConfig,
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
  /** PostgreSQL configuration */
  postgres: {
    user: defineString('POSTGRES_USER'),
    database: defineString('POSTGRES_DB'),
    password: defineString('POSTGRES_PASSWORD'),
    port: defineNumber('POSTGRES_PORT'),
    host: defineString('POSTGRES_HOST'),
    schema: defineString('POSTGRES_SCHEMA'),
  },
  /**
   * Origins allowed for CORS
   */
  allowedOrigins: 'ALLOWED_ORIGINS',
  /**
   * Proxies allowed for CORS
   */
  allowedProxies: 'ALLOWED_PROXIES',
  /** Remote data hosts configuration */
  dataHost: {
    /** Supported data configuration */
    supported: {
      /**
       * Delay to add between two fetchs of the same data host
       */
      fetchDelay: defineNumber('DATAHOST_SUPPORTED_REFRESH_JOB_DELAY'),
    },
  },
  /** Hooks related configuration */
  hooks: {
    /** Hosts that we should never make request to. Supports RegEx */
    bannedHosts: defineJSON('HOOKS_BANNED_HOSTS'),
  },
};

export default envDefinition;
