import { appConfig } from '~/lib/config';
import { initHTTPServer } from '~/lib/http';
import { appLogger } from '~/lib/logger';

import { startCrons } from '~/crons';
import { routes } from '~/routes';

async function start(): Promise<void> {
  appLogger.info({
    env: process.env.NODE_ENV,
    logDir: appConfig.log.dir,
    logLevel: appConfig.log.level,
    msg: 'Service starting',
    scope: 'node',
  });

  try {
    // Initialize core services (if fails, service is unhealthy)
    await initHTTPServer(routes);

    // Initialize other services (if fails, service is degraded)
    startCrons();

    appLogger.info({
      msg: 'Service ready',
      readyDuration: process.uptime(),
      readyDurationUnit: 's',
      scope: 'init',
    });
  } catch (error) {
    appLogger.error(error);
    throw error instanceof Error ? error : new Error(`${error}`);
  }
}

await start();
