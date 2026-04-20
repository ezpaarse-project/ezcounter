import { StatusCodes } from 'http-status-codes';

import { appConfig } from '~/lib/config';
import { getMissingMandatoryServices, initHeartbeat } from '~/lib/heartbeat';
import { initHTTPServer } from '~/lib/http';
import { appLogger } from '~/lib/logger';

import { initQueueConsumers } from '~/queues';

appLogger.info({
  env: process.env.NODE_ENV,
  logDir: appConfig.log.dir,
  logLevel: appConfig.log.level,
  msg: 'Service starting',
  scope: 'node',
});

try {
  // Initialize health routes
  await initHTTPServer({
    '/liveness': (req, res) => {
      res.writeHead(StatusCodes.NO_CONTENT).end();
    },
    '/readiness': (req, res) => {
      res
        .writeHead(
          getMissingMandatoryServices().length > 0
            ? StatusCodes.SERVICE_UNAVAILABLE
            : StatusCodes.NO_CONTENT
        )
        .end();
    },
  });

  // Initialize core services (if fails, service is not alive)

  // Initialize other services (if fails, service is not ready)
  initQueueConsumers();
  initHeartbeat();

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
