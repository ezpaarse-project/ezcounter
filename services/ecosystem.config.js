/**
 * @template {string | number | boolean} Value - Type of default value
 *
 * @param {Uppercase<string>} key - The key to look in env
 * @param {Value} [defValue] - The value if key is missing in env
 *
 * @returns {string | Value} The value from env or default
 */
const env = (key, defValue) => process.env[key] || defValue;

const nodeEnv = {
  NODE_ENV: env('NODE_ENV'),
  TZ: env('TZ'),
};

const logEnv = {
  LOG_DIR: env('LOG_DIR'),
  LOG_IGNORE: env('LOG_IGNORE', JSON.stringify(['hostname'])),
  LOG_LEVEL: env('LOG_LEVEL', 'info'),
};

const heartbeatEnv = {
  HEARTBEAT_EXTERNAL_FREQUENCY_MAX: env(
    'HEARTBEAT_EXTERNAL_FREQUENCY_MAX',
    300_000
  ),
  HEARTBEAT_EXTERNAL_FREQUENCY_MIN: env(
    'HEARTBEAT_EXTERNAL_FREQUENCY_MIN',
    5000
  ),
  HEARTBEAT_FREQUENCY: env('HEARTBEAT_FREQUENCY', 5000),
};

const elasticEnv = {
  ELASTIC_API_KEY: env('ELASTIC_API_KEY', ''),
  ELASTIC_NODES: env(
    'ELASTIC_NODES',
    JSON.stringify([{ url: 'http://elastic:9200' }])
  ),
  ELASTIC_PASSWORD: env('ELASTIC_PASSWORD', 'changeme'),
  ELASTIC_REQUIRED_STATUS: env('ELASTIC_REQUIRED_STATUS', 'green'),
  ELASTIC_USERNAME: env('ELASTIC_USERNAME', 'elastic'),
};

const dbEnv = {
  POSTGRES_PASSWORD: env('POSTGRES_PASSWORD', 'changeme'),
  POSTGRES_URL: env(
    'POSTGRES_URL',
    'postgres://database:5432/ezcounter?schema=default'
  ),
  POSTGRES_USERNAME: env('POSTGRES_USERNAME', 'postgres'),
};

const redisEnv = {
  REDIS_PASSWORD: env('REDIS_PASSWORD'),
  REDIS_URL: env('REDIS_URL', 'redis://redis:6379/'),
  REDIS_USERNAME: env('REDIS_USERNAME'),
};

const rabbitmqEnv = {
  RABBITMQ_PASSWORD: env('RABBITMQ_PASSWORD', 'guest'),
  RABBITMQ_URL: env('RABBITMQ_URL', 'amqp://rabbitmq:5672/'),
  RABBITMQ_USERNAME: env('RABBITMQ_USERNAME', 'guest'),
};

module.exports = {
  apps: [
    {
      cwd: './api',
      env: {
        ...nodeEnv,
        ...logEnv,
        ...heartbeatEnv,
        ...rabbitmqEnv,
        ...dbEnv,

        ALLOWED_ORIGINS: env('ALLOWED_ORIGINS', '*'),

        ALLOWED_PROXIES: env('ALLOWED_PROXIES', '*'),

        DATAHOST_SUPPORTED_REFRESH_JOB_DELAY: Number(
          env('DATAHOST_SUPPORTED_REFRESH_JOB_DELAY', 500)
        ),

        HOOKS_BANNED_HOSTS: env('HOOKS_BANNED_HOSTS', JSON.stringify([])),

        HTTP_PORT: Number(env('API_HTTP_PORT', 8080)),
      },
      increment_var: 'HTTP_PORT',
      instances: env('APIS_CONCURRENCE', 1),
      interpreter: 'tsx',
      merge_logs: false,
      name: 'api',
      script: './src/app.ts',
    },
    {
      cwd: './enricher',
      env: {
        ...nodeEnv,
        ...logEnv,
        ...heartbeatEnv,
        ...rabbitmqEnv,
        ...redisEnv,
        ...elasticEnv,

        EZUNPAYWALL_API_KEY: env('EZUNPAYWALL_API_KEY'),
        EZUNPAYWALL_BASE_URL: env(
          'EZUNPAYWALL_BASE_URL',
          'https://unpaywall.inist.fr/api/graphql/'
        ),
        EZUNPAYWALL_RETRY: Number(env('EZUNPAYWALL_RETRY', 3)),
        EZUNPAYWALL_RETRY_DELAY_MILLISECONDS: Number(
          env('EZUNPAYWALL_RETRY_DELAY_MILLISECONDS', 0)
        ),
        EZUNPAYWALL_RETRY_DELAY_MINUTES: Number(
          env('EZUNPAYWALL_RETRY_DELAY_MINUTES', 0)
        ),
        EZUNPAYWALL_RETRY_DELAY_SECONDS: Number(
          env('EZUNPAYWALL_RETRY_DELAY_SECONDS', 20)
        ),
        EZUNPAYWALL_STORE_TTL_DAYS: Number(
          env('EZUNPAYWALL_STORE_TTL_DAYS', 0)
        ),
        EZUNPAYWALL_STORE_TTL_HOURS: Number(
          env('EZUNPAYWALL_STORE_TTL_HOURS', 0)
        ),
        EZUNPAYWALL_STORE_TTL_MINUTES: Number(
          env('EZUNPAYWALL_STORE_TTL_MINUTES', 0)
        ),
        EZUNPAYWALL_STORE_TTL_MONTHS: Number(
          env('EZUNPAYWALL_STORE_TTL_MONTHS', 0)
        ),
        EZUNPAYWALL_STORE_TTL_WEEKS: Number(
          env('EZUNPAYWALL_STORE_TTL_WEEKS', 1)
        ),
        EZUNPAYWALL_TIMEOUT_MILLISECONDS: Number(
          env('EZUNPAYWALL_TIMEOUT_MILLISECONDS', 0)
        ),
        EZUNPAYWALL_TIMEOUT_MINUTES: Number(
          env('EZUNPAYWALL_TIMEOUT_MINUTES', 0)
        ),
        EZUNPAYWALL_TIMEOUT_SECONDS: Number(
          env('EZUNPAYWALL_TIMEOUT_SECONDS', 20)
        ),

        HTTP_PORT: Number(env('ENRICHER_HTTP_PORT', 8280)),

        OPENALEX_API_KEY: env('OPENALEX_API_KEY'),
        OPENALEX_BASE_URL: env(
          'OPENALEX_BASE_URL',
          'https://unpaywall.inist.fr/api/graphql/'
        ),
        OPENALEX_IS_CNRS_GATEWAY: Boolean(
          env('OPENALEX_IS_CNRS_GATEWAY', true)
        ),
        OPENALEX_RETRY: Number(env('OPENALEX_RETRY', 3)),
        OPENALEX_RETRY_DELAY_MILLISECONDS: Number(
          env('OPENALEX_RETRY_DELAY_MILLISECONDS', 0)
        ),
        OPENALEX_RETRY_DELAY_MINUTES: Number(
          env('OPENALEX_RETRY_DELAY_MINUTES', 0)
        ),
        OPENALEX_RETRY_DELAY_SECONDS: Number(
          env('OPENALEX_RETRY_DELAY_SECONDS', 20)
        ),
        OPENALEX_STORE_TTL_DAYS: Number(env('OPENALEX_STORE_TTL_DAYS', 0)),
        OPENALEX_STORE_TTL_HOURS: Number(env('OPENALEX_STORE_TTL_HOURS', 0)),
        OPENALEX_STORE_TTL_MINUTES: Number(
          env('OPENALEX_STORE_TTL_MINUTES', 0)
        ),
        OPENALEX_STORE_TTL_MONTHS: Number(env('OPENALEX_STORE_TTL_MONTHS', 0)),
        OPENALEX_STORE_TTL_WEEKS: Number(env('OPENALEX_STORE_TTL_WEEKS', 1)),
        OPENALEX_TIMEOUT_MILLISECONDS: Number(
          env('OPENALEX_TIMEOUT_MILLISECONDS', 0)
        ),
        OPENALEX_TIMEOUT_MINUTES: Number(env('OPENALEX_TIMEOUT_MINUTES', 0)),
        OPENALEX_TIMEOUT_SECONDS: Number(env('OPENALEX_TIMEOUT_SECONDS', 20)),
      },
      increment_var: 'HTTP_PORT',
      instances: env('ENRICHERS_CONCURRENCE', 6),
      interpreter: 'tsx',
      merge_logs: false,
      name: 'enricher',
      script: './src/app.ts',
    },
    {
      cwd: './harvester',
      env: {
        ...nodeEnv,
        ...logEnv,
        ...heartbeatEnv,
        ...rabbitmqEnv,

        DOWNLOAD_DETACH_DELAY_HOURS: Number(
          env('DOWNLOAD_DETACH_DELAY_HOURS', 0)
        ),
        DOWNLOAD_DETACH_DELAY_MILLISECONDS: Number(
          env('DOWNLOAD_DETACH_DELAY_MILLISECONDS', 0)
        ),
        DOWNLOAD_DETACH_DELAY_MINUTES: Number(
          env('DOWNLOAD_DETACH_DELAY_MINUTES', 0)
        ),
        DOWNLOAD_DETACH_DELAY_SECONDS: Number(
          env('DOWNLOAD_DETACH_DELAY_SECONDS', 5)
        ),

        DOWNLOAD_JOB_DELAY_HOURS: Number(env('DOWNLOAD_JOB_DELAY_HOURS', 0)),
        DOWNLOAD_JOB_DELAY_MILLISECONDS: Number(
          env('DOWNLOAD_JOB_DELAY_MILLISECONDS', 500)
        ),
        DOWNLOAD_JOB_DELAY_MINUTES: Number(
          env('DOWNLOAD_JOB_DELAY_MINUTES', 0)
        ),
        DOWNLOAD_JOB_DELAY_SECONDS: Number(
          env('DOWNLOAD_JOB_DELAY_SECONDS', 0)
        ),

        DOWNLOAD_MAX_TRIES: Number(env('DOWNLOAD_MAX_TRIES', 5)),

        DOWNLOAD_PROCESSING_BACKOFF_HOURS: Number(
          env('DOWNLOAD_PROCESSING_BACKOFF_HOURS', 0)
        ),
        DOWNLOAD_PROCESSING_BACKOFF_MILLISECONDS: Number(
          env('DOWNLOAD_PROCESSING_BACKOFF_MILLISECONDS', 0)
        ),
        DOWNLOAD_PROCESSING_BACKOFF_MINUTES: Number(
          env('DOWNLOAD_PROCESSING_BACKOFF_MINUTES', 10)
        ),
        DOWNLOAD_PROCESSING_BACKOFF_SECONDS: Number(
          env('DOWNLOAD_PROCESSING_BACKOFF_SECONDS', 0)
        ),

        DOWNLOAD_UNAVAILABLE_BACKOFF_HOURS: Number(
          env('DOWNLOAD_UNAVAILABLE_BACKOFF_HOURS', 0)
        ),
        DOWNLOAD_UNAVAILABLE_BACKOFF_MILLISECONDS: Number(
          env('DOWNLOAD_UNAVAILABLE_BACKOFF_MILLISECONDS', 0)
        ),
        DOWNLOAD_UNAVAILABLE_BACKOFF_MINUTES: Number(
          env('DOWNLOAD_UNAVAILABLE_BACKOFF_MINUTES', 0)
        ),
        DOWNLOAD_UNAVAILABLE_BACKOFF_SECONDS: Number(
          env('DOWNLOAD_UNAVAILABLE_BACKOFF_SECONDS', 5)
        ),
        HTTP_PORT: Number(env('HARVESTER_HTTP_PORT', 8180)),
      },
      increment_var: 'HTTP_PORT',
      instances: env('HARVESTERS_CONCURRENCE', 3),
      interpreter: 'tsx',
      merge_logs: false,
      name: 'harvester',
      script: './src/app.ts',
    },
  ].filter((app) => !env(`DISABLE_${app.name.toUpperCase()}`, 0)),
};
