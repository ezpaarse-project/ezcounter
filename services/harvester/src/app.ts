import { appLogger } from '~/lib/logger';
import { config } from '~/lib/config';
import { initHTTPServer } from '~/lib/http';
import { useRabbitMQ } from '~/lib/rabbitmq';
import { initHeartbeat, getMissingMandatoryServices } from '~/lib/heartbeat';

import { initQueues } from '~/queues';

appLogger.info({
  scope: 'node',
  env: process.env.NODE_ENV,
  logLevel: config.log.level,
  logDir: config.log.dir,
  msg: 'Service starting',
});

try {
  // Initialize health routes
  await initHTTPServer({
    '/liveness': (req, res) => {
      res.writeHead(204).end();
    },
    '/readiness': (req, res) => {
      const missing = getMissingMandatoryServices();
      if (missing.length > 0) {
        res.writeHead(503).end();
      } else {
        res.writeHead(204).end();
      }
    },
  });

  // Initialize core services (if fails, service is not alive)

  // Initialize other services (if fails, service is not ready)
  await useRabbitMQ(async (connection) => {
    await initQueues(connection);
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
