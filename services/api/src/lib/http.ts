import type { SecureServerOptions } from 'node:http2';
import { readFile } from 'node:fs/promises';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyFactory, {
  type FastifyInstance,
  type FastifyPluginAsync,
} from 'fastify';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { loggerPlugin } from '~/plugins/logger';

// oxlint-disable-next-line no-magic-numbers - One day as seconds
const CACHE_OPTIONS_DURATION = 24 * 60 * 60;

const logger = appLogger.child({ scope: 'http' });
const config = appConfig.http;

/**
 * Transform app config into `trustProxy` for fastify
 *
 * @returns The `trustProxy` value
 */
const getTrustedProxies = (): true | string[] =>
  config.cors.allowedProxies === '*'
    ? true
    : config.cors.allowedProxies.split(',');

/**
 * Transform app config into `origin` for @fastify/cors
 *
 * @returns The `trustProxy` value
 */
const getCORSOrigins = (): '*' | string[] =>
  config.cors.allowedOrigins === '*'
    ? '*'
    : config.cors.allowedOrigins.split(',');

/**
 * Transform app config into `https` for fastify
 *
 * @returns The `https` value
 */
async function getTLSOptions(): Promise<SecureServerOptions | null> {
  if (config.tls.key || config.tls.cert) {
    // Throw if one of them is missing
    if (!config.tls.key || !config.tls.cert) {
      throw new Error('Missing key filepath or cert filepath to setup HTTPS');
    }

    return {
      allowHTTP1: true,
      cert: await readFile(config.tls.cert),
      key: await readFile(config.tls.key),
    };
  }

  return null;
}

/**
 * Create a fastify instance using `http` or `http2` using config
 *
 * @returns The fastify instance
 */
async function createFastify(): Promise<FastifyInstance> {
  const baseOptions = {
    logger: false,
    trustProxy: getTrustedProxies(),
  };

  const https = await getTLSOptions();

  if (https) {
    // @ts-expect-error - Fastify have different return type for http2 and http1, we won't use theses differences
    return fastifyFactory({ ...baseOptions, http2: true, https });
  }

  return fastifyFactory(baseOptions);
}

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
  // Create Fastify instance
  const fastify = await createFastify();

  // Register cors
  await fastify.register(cors, {
    allowedHeaders: ['Content-Type', 'Accept'],
    cacheControl: CACHE_OPTIONS_DURATION,
    credentials: false,
    maxAge: CACHE_OPTIONS_DURATION,
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'DELETE'],
    origin: getCORSOrigins(),
  });

  // Register helmet
  await fastify.register(helmet, {
    crossOriginEmbedderPolicy: true,
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
