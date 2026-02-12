import { appLogger } from '~/lib/logger';
import { config } from '~/lib/config';
import { initHTTPServer } from '~/lib/http';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initHeartbeat } from '~/lib/heartbeat';

import { routes } from '~/routes';

async function start(): Promise<void> {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  try {
    // Initialize core services (if fails, service is unhealthy)
    await initHTTPServer(routes);

    // Initialize other services (if fails, service is degraded)
    await useRabbitMQ(async (connection) => {
      await initHeartbeat(connection);
    });

    appLogger.info({
      scope: 'init',
      readyDuration: process.uptime(),
      readyDurationUnit: 's',
      msg: 'Service ready',
    });
  } catch (err) {
    appLogger.error(err);
    throw err instanceof Error ? err : new Error(`${err}`);
  }
}

await start();
