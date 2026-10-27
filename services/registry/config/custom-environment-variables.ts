import {
  type EnvOfConfig,
  defineDuration,
  defineJSON,
  defineNumber,
  defineString,
} from '@ezcounter/config/env';

import type defaultConfig from './default.json';

const envDefinition: EnvOfConfig<typeof defaultConfig> = {
  /** HTTP server configuration */
  http: {
    /**
     * Port that HTTP server will listen
     */
    port: defineNumber('HTTP_PORT'),
    /** TLS options */
    tls: {
      key: defineString('HTTP_TLS_KEY_PATH'),
      cert: defineString('HTTP_TLS_CERT_PATH'),
    },
    /** CORS options */
    cors: {
      /**
       * Origins allowed
       */
      allowedOrigins: defineString('ALLOWED_ORIGINS'),
      /**
       * Proxies allowed
       */
      allowedProxies: defineString('ALLOWED_PROXIES'),
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
  /** PostgreSQL configuration */
  postgres: {
    url: defineString('POSTGRES_URL'),
    username: defineString('POSTGRES_USERNAME'),
    password: defineString('POSTGRES_PASSWORD'),
  },
  /** Source of local registry */
  source: {
    /**
     * URL to the source, can be another ezCOUNTER API, ezCOUNTER registry instance or COUNTER registry
     *
     * Will act as a local-only if left empty
     */
    baseURL: defineString('REGISTRY_SOURCE_URL'),

    /**
     * Retry configuration
     */
    retry: defineNumber('REGISTRY_SOURCE_RETRY'),
    retryDelay: defineDuration('REGISTRY_SOURCE_RETRY_DELAY', [
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    /**
     * Timeout of the request
     */
    timeout: defineDuration('REGISTRY_SOURCE_TIMEOUT', [
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    /**
     * Cron expression describing how often sync should run
     */
    syncSchedule: defineString('REGISTRY_SOURCE_SYNC_SCHEDULE'),
  },
};

export default envDefinition;
