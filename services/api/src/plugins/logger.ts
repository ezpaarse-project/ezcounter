import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { StatusCodes } from 'http-status-codes';

import type { Level } from '@ezcounter/logger';

import { accessLogger } from '~/lib/logger';

const MS_TO_S_MULTIPLIER = 1000;

const requestDates = new Map<string, number>();

function isLogLevel(level: string): level is Level {
  return Object.keys(accessLogger.levels.values).includes(level);
}

/**
 * Log request with status code and time
 *
 * @param request - The fastify request
 * @param reply - The fastify response, if exist
 */
function logRequest(request: FastifyRequest, reply?: FastifyReply): void {
  const end = process.uptime();
  const start = requestDates.get(request.id) ?? end;
  requestDates.delete(request.id);

  const data = {
    duration: (end - start) * MS_TO_S_MULTIPLIER,
    durationUnit: 'ms',
    method: request.method,
    statusCode: reply?.statusCode ?? 0,
    url: request.url,
  };

  if (
    reply &&
    reply.statusCode >= StatusCodes.OK &&
    reply.statusCode < StatusCodes.BAD_REQUEST
  ) {
    const level = isLogLevel(request.routeOptions?.logLevel)
      ? request.routeOptions.logLevel
      : 'info';
    accessLogger[level](data);
    return;
  }
  accessLogger.error(data);
}

/**
 * Fastify plugin to format response and log requests
 *
 * @param fastify - The fastify instance
 */
// oxlint-disable require-await
const loggerBasePlugin: FastifyPluginAsync = async (fastify) => {
  // Register request date
  fastify.addHook('onRequest', async (request) => {
    requestDates.set(request.id, process.uptime());
  });

  // Log request
  fastify.addHook('onResponse', async (request, reply) => {
    logRequest(request, reply);
  });

  // Log request
  fastify.addHook('onRequestAbort', async (request) => {
    logRequest(request);
  });
};
// oxlint-enable require-await

// Register plugin
export const loggerPlugin = fp(loggerBasePlugin, {
  encapsulate: false,
  name: 'ezc-logger',
});
