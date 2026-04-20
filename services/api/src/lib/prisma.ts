import type { Heartbeat } from '@ezcounter/heartbeats/dto';
import { pingDB, setupDB } from '@ezcounter/database';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'prisma' });

/**
 * The Prisma client
 */
export const dbClient = setupDB(logger, appConfig.postgres);

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working
 */
export const dbPing = (): Promise<Omit<Heartbeat, 'nextAt' | 'updatedAt'>> =>
  pingDB(dbClient);
