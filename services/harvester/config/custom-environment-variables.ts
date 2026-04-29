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
  download: {
    processingBackoff: defineDuration('DOWNLOAD_PROCESSING_BACKOFF', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    unavailableBackoff: defineDuration('DOWNLOAD_PROCESSING_BACKOFF', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    detachDelay: defineDuration('DOWNLOAD_PROCESSING_BACKOFF', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    jobDelay: defineDuration('DOWNLOAD_PROCESSING_BACKOFF', [
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
    ]),
    maxTries: defineNumber('DOWNLOAD_MAX_TRIES'),
  },
};

export default envDefinition;
