import { setupDB, pingDB } from '@ezcounter/database';
import type { Heartbeat } from '@ezcounter/heartbeats/types';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'prisma' });

export const dbClient = setupDB(logger);

/**
 * Execute a dummy query to check if the database connection is working
 *
 * @returns If the connection is working
 */
export const dbPing = (): Promise<Omit<Heartbeat, 'nextAt' | 'updatedAt'>> =>
  pingDB(dbClient);
