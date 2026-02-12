import createFastify, {
  type FastifyInstance,
  type FastifyPluginAsync,
} from 'fastify';
import fastifyCors from '@fastify/cors';

import { appLogger } from '~/lib/logger';
import { config } from '~/lib/config';

import { loggerPlugin } from '~/plugins/logger';

const { port, allowedOrigins, allowedProxies } = config;
const logger = appLogger.child({ scope: 'http' });

// Split origins while allowing *
const corsOrigin: '*' | string[] =
  allowedOrigins === '*' ? '*' : allowedOrigins.split(',');

// Split proxies while allowing *
let trustProxy: true | string[] =
  allowedProxies === '*' ? true : allowedProxies.split(',');

export async function initHTTPServer(
  routes: FastifyPluginAsync
): Promise<FastifyInstance> {
  const start = process.uptime();

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

  // Start server and wait for it to be ready
  const address = await fastify.listen({ port, host: '::' });
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
    port,
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Service listening',
  });

  return fastify;
}
