import KeyvRedis, { type RedisClientType, createClient } from '@keyv/redis';

import type { Heartbeat } from '@ezcounter/heartbeats/dto';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const config = appConfig.redis;
const logger = appLogger.child(
  { scope: 'redis' },
  {
    redact: {
      censor: (value) =>
        typeof value === 'string' && ''.padStart(value.length, '*'),
      paths: ['config.password'],
    },
  }
);

const clients: RedisClientType[] = [];

const onShutdown = async (): Promise<void> => {
  await Promise.all(clients.map((store) => store.close()));
};

process.on('SIGINT', onShutdown);
process.on('SIGTERM', onShutdown);

/**
 * Test connection to redis
 *
 * @param client - The redis client
 * @param namespace - The namespace of the client
 */
async function testConnection(
  client: RedisClientType,
  namespace: string
): Promise<void> {
  try {
    await client.connect();
    logger.info({ msg: 'Connected to redis', namespace });
  } catch (error) {
    logger.error({ err: error, msg: 'Unable to connect to redis', namespace });
  }
}

/**
 * Create a Redis Client
 *
 * @param namespace - The namespace of the client
 *
 * @returns Redis connection
 */
function createRedisClient(namespace: string): RedisClientType {
  const client = createClient({
    password: config.password,
    url: config.url,
    username: config.username,
  });

  client.on('error', (error) => {
    logger.error({ err: error, msg: 'Redis client error', namespace });
  });

  void testConnection(client, namespace);

  clients.push(client);
  return client;
}

// Create a redis client to check connection
const rootRedis = createRedisClient('heartbeat');
clients.push(rootRedis);

/**
 * Create a Keyv adapter for Redis
 *
 * @param namespace - The namespace of the client
 *
 * @returns Keyv adapter
 */
export function createKeyvRedis<DataType>(
  namespace: string
): KeyvRedis<DataType> {
  const store = new KeyvRedis<DataType>(createRedisClient(namespace));

  store.on('error', (error) => {
    logger.error({ err: error, msg: 'Redis client error' });
  });

  return store;
}

/**
 * Execute a dummy query to check if the Redis connection is working
 *
 * @returns If the connection is working
 */
export async function redisPing(): Promise<
  Omit<Heartbeat, 'nextAt' | 'updatedAt'>
> {
  await rootRedis.ping();

  return {
    hostname: URL.parse(config.url)?.hostname ?? 'redis',
    service: 'redis',
  };
}
