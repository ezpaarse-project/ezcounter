import createFastify, {
  type FastifyInstance,
  type FastifyPluginAsync,
} from 'fastify';
import fastifyCors from '@fastify/cors';

import { appLogger } from '~/lib/logger';
import { config } from '~/lib/config';

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
  let trustProxy: true | string[] =
    config.allowedProxies === '*' ? true : config.allowedProxies.split(',');

  // Create Fastify instance
  const fastify = createFastify({
    trustProxy,
    logger: false,
  });

  // Register cors
  await fastify.register(fastifyCors, {
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
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
  const address = await fastify.listen({ port: config.port, host: '::' });
  await fastify.ready();

  // Register graceful shutdown
  process.on('SIGTERM', async () => {
    try {
      await fastify.close();
      logger.debug('Service HTTP closed');
    } catch (err) {
      logger.error({ msg: 'Failed to close HTTP service', err });
    }
  });

  logger.info({
    address,
    port: config.port,
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Service listening',
  });

  return fastify;
}
