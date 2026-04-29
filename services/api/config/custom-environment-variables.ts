import {
  type EnvOfConfig,
  defineDuration,
  defineJSON,
  defineNumber,
  defineString,
} from '@ezcounter/config/env';

import type defaultConfig from './default.json';

const envDefinition: EnvOfConfig<typeof defaultConfig> = {
  port: defineNumber('HTTP_PORT'),
  heartbeat: {
    self: defineNumber('HEARTBEAT_FREQUENCY'),
    connected: {
      min: defineNumber('HEARTBEAT_EXTERNAL_FREQUENCY_MIN'),
      max: defineNumber('HEARTBEAT_EXTERNAL_FREQUENCY_MAX'),
    },
  },
  log: {
    level: defineString('LOG_LEVEL'),
    dir: defineString('LOG_DIR'),
    ignore: defineJSON('LOG_IGNORE'),
  },
  rabbitmq: {
    url: defineString('RABBITMQ_URL'),
    username: defineString('RABBITMQ_USERNAME'),
    password: defineString('RABBITMQ_PASSWORD'),
  },
  postgres: {
    user: defineString('POSTGRES_USER'),
    database: defineString('POSTGRES_DB'),
    password: defineString('POSTGRES_PASSWORD'),
    port: defineNumber('POSTGRES_PORT'),
    host: defineString('POSTGRES_HOST'),
    schema: defineString('POSTGRES_SCHEMA'),
  },
  allowedOrigins: 'ALLOWED_ORIGINS',
  allowedProxies: 'ALLOWED_PROXIES',
  dataHost: {
    supported: {
      refreshJobDelay: defineNumber('DATAHOST_SUPPORTED_REFRESH_JOB_DELAY'),
      cacheDuration: defineDuration(
        'DATAHOST_SUPPORTED_CACHE_DURATION_MONTHS',
        ['months', 'weeks', 'days', 'hours', 'minutes']
      ),
    },
  },
};

export default envDefinition;
