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
  elasticsearch: {
    url: defineString('ELASTIC_URL'),
    username: defineString('ELASTIC_USERNAME'),
    password: defineString('ELASTIC_PASSWORD'),
    apiKey: defineString('ELASTIC_API_KEY'),
    tls: {
      rejectUnauthorized: defineBoolean('ELASTIC_TLS_REJECT_UNAUTHORIZED'),
    },
  },
  redis: {
    url: defineString('REDIS_URL'),
    username: defineString('REDIS_USERNAME'),
    password: defineString('REDIS_PASSWORD'),
  },
  enrich: {
    sources: {
      ezunpaywall: {
        baseUrl: defineString('EZUNPAYWALL_BASE_URL'),
        apiKey: defineString('EZUNPAYWALL_API_KEY'),
        retry: defineNumber('EZUNPAYWALL_RETRY'),
        retryDelay: defineDuration('EZUNPAYWALL_RETRY_DELAY', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        timeout: defineDuration('EZUNPAYWALL_TIMEOUT', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        storeTtl: defineDuration('EZUNPAYWALL_STORE_TTL', [
          'months',
          'weeks',
          'days',
          'hours',
          'minutes',
        ]),
      },
      openalex: {
        baseUrl: defineString('OPENALEX_BASE_URL'),
        apiKey: defineString('OPENALEX_API_KEY'),
        isCNRSGateway: defineBoolean('OPENALEX_IS_CNRS_GATEWAY'),
        retry: defineNumber('OPENALEX_RETRY'),
        retryDelay: defineDuration('OPENALEX_RETRY_DELAY', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
        timeout: defineDuration('OPENALEX_TIMEOUT', [
          'minutes',
          'seconds',
          'milliseconds',
        ]),
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
