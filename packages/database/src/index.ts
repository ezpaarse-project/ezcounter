import { PrismaPg } from '@prisma/adapter-pg';

import type { Logger } from '@ezreeport/logger';
import type { Heartbeat } from '@ezreeport/heartbeats/types';

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
 * Setup DB connection
 *
 * @param logger - The app logger
 * @param logger - The app logger
 *
 * @returns The DB client
 */
export function setupDB(
  logger: Logger,
  { schema, ...config }: DatabaseConfig
): PrismaClient {
  const client = new PrismaClient({
    adapter: new PrismaPg(config, { schema }),
    // Disable logger of Prisma, in order to events to our own
    log: [
      { level: 'query', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
    // Disable formatted errors in production
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  });

  // Link events to logger
  client.$on('query', (event) =>
    logger.trace({ ...event, durationUnit: 'ms' })
  );
  client.$on('info', (event) =>
    logger.info({ ...event, message: undefined, msg: event.message })
  );
  client.$on('warn', (event) =>
    logger.warn({ ...event, message: undefined, msg: event.message })
  );
  client.$on('error', (event) =>
    logger.error({ ...event, message: undefined, msg: event.message })
  );

  // Test connection
  client
    .$connect()
    // oxlint-disable-next-line prefer-await-to-then
    .then(() => {
      logger.info({ msg: 'Connected to database' });
      client.$disconnect();
      return true;
    })
    // oxlint-disable-next-line prefer-await-to-then,prefer-await-to-callbacks
    .catch((err) => {
      logger.fatal({ msg: 'Unable to connect to database', err });
      throw err;
    });

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

  const { hostname, version, usage, db } = response[0];
  const versionMatch = /^PostgreSQL (\S+) /.exec(version);

  return {
    hostname,
    service: 'database',
    version: versionMatch?.[1],
    filesystems: [
      {
        name: `[database] ${db}`,
        available: -1,
        used: Number(usage),
        total: -1,
      },
    ],
  };
}
