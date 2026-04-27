import KeyvRedis, { type RedisClientType, createClient } from '@keyv/redis';

import type { Heartbeat } from '@ezcounter/heartbeats/dto';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { redis: config } = appConfig;
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
 */
async function testConnection(client: RedisClientType): Promise<void> {
  try {
    await client.connect();
    logger.info({ msg: 'Connected to redis' });
  } catch (error) {
    logger.error({ err: error, msg: 'Unable to connect to redis' });
  }
}

/**
 * Create a Redis Client
 *
 * @returns Redis connection
 */
function createRedisClient(): RedisClientType {
  const client = createClient({
    password: config.password,
    url: config.url,
    username: config.username,
  });

  client.on('error', (error) => {
    logger.error({ err: error, msg: 'Redis client error' });
  });

  void testConnection(client);

  clients.push(client);
  return client;
}

// Create a redis client to check connection
const rootRedis = createRedisClient();
clients.push(rootRedis);

/**
 * Create a Keyv adapter for Redis
 *
 * @returns Keyv adapter
 */
export function createKeyvRedis<DataType>(): KeyvRedis<DataType> {
  const store = new KeyvRedis<DataType>(createRedisClient());

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
    hostname: 'redis',
    service: 'redis',
  };
}
