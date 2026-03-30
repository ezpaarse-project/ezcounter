import fastifyCors from '@fastify/cors';
import createFastify, {
  type FastifyInstance,
  type FastifyPluginAsync,
} from 'fastify';

import { config } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { loggerPlugin } from '~/plugins/logger';

const logger = appLogger.child({ scope: 'http' });

/**
 * Create HTTP server, register plugins and provided routes
 *
 * @param routes - Routes to register
 *
 * @returns The HTTP server
 */
export async function createServer(
  routes: FastifyPluginAsync
): Promise<FastifyInstance> {
  // Split origins while allowing *
  const corsOrigin: '*' | string[] =
    config.allowedOrigins === '*' ? '*' : config.allowedOrigins.split(',');

  // Split proxies while allowing *
  const trustProxy: true | string[] =
    config.allowedProxies === '*' ? true : config.allowedProxies.split(',');

  // Create Fastify instance
  const fastify = createFastify({
    logger: false,
    trustProxy,
  });

  // Register cors
  await fastify.register(fastifyCors, {
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    origin: corsOrigin,
  });

  // Register logger
  await fastify.register(loggerPlugin);

  // Register routes
  await fastify.register(routes);

  return fastify;
}

/**
 * Initialize HTTP server, making it listen to configured port and gracefully stop
 *
 * @param routes - Routes to register
 *
 * @returns The HTTP server
 */
export async function initHTTPServer(
  routes: FastifyPluginAsync
): Promise<FastifyInstance> {
  const start = process.uptime();

  const fastify = await createServer(routes);

  // Start server and wait for it to be ready
  const address = await fastify.listen({ host: '::', port: config.port });
  await fastify.ready();

  const onStop = async (): Promise<void> => {
    try {
      await fastify.close();
      logger.debug('Service HTTP closed');
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to close HTTP service' });
    }
  };

  // Register graceful shutdown
  process.on('SIGTERM', () => {
    void onStop();
  });

  logger.info({
    address,
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Service listening',
    port: config.port,
  });

  return fastify;
}
