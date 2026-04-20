import { PrismaPg } from '@prisma/adapter-pg';

import type { Heartbeat } from '@ezcounter/heartbeats/dto';
import type { Logger } from '@ezcounter/logger';

import { PrismaClient } from '../.prisma/client';

type DatabaseConfig = {
  user: string;
  database: string;
  password: string;
  port: number;
  host: string;
  schema?: string;
};

/**
 * Test connection to database
 *
 * @param logger - The app logger
 * @param client - The DB client
 */
async function testConnection(
  logger: Logger,
  client: PrismaClient
): Promise<void> {
  try {
    await client.$connect();
    logger.info({ msg: 'Connected to database' });
    await client.$disconnect();
  } catch (error) {
    logger.error({ err: error, msg: 'Unable to connect to database' });
  }
}

export * from '../.prisma/client';

/**
 * Setup DB connection
 *
 * @param logger - The app logger
 * @param config - The configuration to setup client
 * @param config.schema - The PostgreSQL schema to use
 *
 * @returns The DB client
 */
export function setupDB(
  logger: Logger,
  { schema, ...config }: DatabaseConfig
): PrismaClient {
  const client = new PrismaClient({
    adapter: new PrismaPg(config, { schema }),
    // Disable formatted errors in production
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    // Disable logger of Prisma, in order to events to our own
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' },
    ],
  });

  // Link events to logger
  client.$on('query', (event) => {
    logger.trace({ ...event, durationUnit: 'ms' });
  });
  client.$on('info', (event) => {
    logger.info({ ...event, message: undefined, msg: event.message });
  });
  client.$on('warn', (event) => {
    logger.warn({ ...event, message: undefined, msg: event.message });
  });
  client.$on('error', (event) => {
    logger.error({ ...event, message: undefined, msg: event.message });
  });

  void testConnection(logger, client);

  return client;
}

/**
 * Check DB status
 *
 * @param client - The DB client
 *
 * @returns The DB information, in the format of a heartbeat
 */
export async function pingDB(
  client: PrismaClient
): Promise<Omit<Heartbeat, 'nextAt' | 'updatedAt'>> {
  const response = await client.$queryRaw<
    { hostname: string; version: string; db: string; usage: string }[]
  >`
  SELECT inet_server_addr() AS hostname,
    version()::text,
    current_database()::text AS db,
    pg_database_size(current_database())::text AS usage
  `;

  const [{ hostname, version, usage, db }] = response;
  const versionMatch = /^PostgreSQL (\S+) /.exec(version);

  return {
    filesystems: [
      {
        available: -1,
        name: `[database] ${db}`,
        total: -1,
        used: Number(usage),
      },
    ],
    hostname,
    service: 'database',
    version: versionMatch?.[1],
  };
}
