import type { Server } from 'node:http';

import { setupHTTPServer, type Route } from '@ezcounter/simple-http';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { port } = config;
const logger = appLogger.child({ scope: 'http' });

export function initHTTPServer(routes: Record<string, Route>): Promise<Server> {
  return setupHTTPServer(port, logger, routes);
}
