import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/models/lib/zod';

import {
  service,
  getMissingMandatoryServices,
  getAllServices,
} from '~/lib/heartbeat';
import { appLogger } from '~/lib/logger';

import { Heartbeat } from '~/models/heartbeat/types';

import { HTTPError } from '~/routes/v1/errors';
import {
  EmptyResponse,
  buildResponse,
  describeSuccess,
  describeErrors,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    logLevel: 'debug',
    schema: {
      summary: 'Get status of stack',
      tags: ['health'],
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(
          z.object({
            current: z.string().describe('Current service'),
            version: z.string().describe('Current version'),
            services: z
              .array(Heartbeat)
              .describe('Services connected to current'),
          })
        ),
      },
    },
    handler: async (request, reply) =>
      buildResponse(reply, {
        current: service.name,
        version: service.version,
        services: getAllServices(),
      }),
  });

  fastify.route({
    method: 'GET',
    url: '/services',
    logLevel: 'debug',
    schema: {
      summary: 'Ping all services',
      tags: ['health'],
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(
          z.array(Heartbeat).describe('Services connected to current')
        ),
      },
    },
    handler: async (request, reply) => buildResponse(reply, getAllServices()),
  });

  fastify.route({
    method: 'GET',
    url: '/services/:name',
    logLevel: 'debug',
    schema: {
      summary: 'Ping a service',
      tags: ['health'],
      params: z.object({
        name: z.string().describe('Service name'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(Heartbeat),
      },
    },
    handler: async (request, reply) => {
      const all = getAllServices();
      const content = all.find((srv) => srv.service === request.params.name);
      if (!content) {
        throw new HTTPError(
          StatusCodes.NOT_FOUND,
          `Service ${request.params.name} not found`
        );
      }

      return buildResponse(reply, content);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/probes/liveness',
    logLevel: 'debug',
    schema: {
      summary: 'Shorthand for liveness probe',
      tags: ['health'],
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
    },
    handler: async (request, reply) => {
      reply.status(StatusCodes.NO_CONTENT);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/probes/readiness',
    logLevel: 'debug',
    schema: {
      summary: 'Shorthand for readiness probe',
      tags: ['health'],
      response: {
        ...describeErrors([
          StatusCodes.SERVICE_UNAVAILABLE,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
    },
    handler: async (request, reply) => {
      const missing = getMissingMandatoryServices();
      if (missing.length <= 0) {
        reply.status(StatusCodes.NO_CONTENT);
        return;
      }

      const message = 'Readiness probe failed: missing mandatory services';
      appLogger.error({ message, missing });
      throw new HTTPError(StatusCodes.SERVICE_UNAVAILABLE, message);
    },
  });
};

export default router;
