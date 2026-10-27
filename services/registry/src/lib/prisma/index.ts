import { setupDB } from '@ezcounter/database';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child(
  { scope: 'prisma' },
  {
    redact: {
      censor: (value) =>
        typeof value === 'string' && ''.padStart(value.length, '*'),
      paths: ['config.password'],
    },
  }
);

/**
 * Prisma parameters related to pagination
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/queries/pagination
 */
export type PaginationParams = {
  take?: number;
  skip?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
};

/**
 * The Prisma client
 */
export const dbClient = setupDB(logger, appConfig.postgres);
