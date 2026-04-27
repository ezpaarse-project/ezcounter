import type { Server } from 'node:http';

import { type Route, setupHTTPServer } from '@ezcounter/simple-http';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'http' });

export function initHTTPServer(routes: Record<string, Route>): Promise<Server> {
  return setupHTTPServer(appConfig.port, logger, routes);
}
