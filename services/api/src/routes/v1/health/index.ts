import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import {
  appService,
  getAllServices,
  getMissingMandatoryServices,
} from '~/lib/heartbeat';
import { appLogger } from '~/lib/logger';

import { Heartbeat } from '~/models/heartbeat/dto';

import { HTTPError } from '~/routes/v1/errors';
import {
  EmptyResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) =>
      buildResponse(reply, {
        current: appService.name,
        services: getAllServices(),
        version: appService.version,
      }),
    logLevel: 'debug',
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(
          z.object({
            current: z.string().describe('Current service'),
            services: z
              .array(Heartbeat)
              .describe('Services connected to current'),
            version: z.string().describe('Current version'),
          })
        ),
      },
      summary: 'Get status of stack',
      tags: ['health'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => buildResponse(reply, getAllServices()),
    logLevel: 'debug',
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(
          z.array(Heartbeat).describe('Services connected to current')
        ),
      },
      summary: 'Ping all services',
      tags: ['health'],
    },
    url: '/services',
  });

  fastify.route({
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
    logLevel: 'debug',
    method: 'GET',
    schema: {
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
      summary: 'Ping a service',
      tags: ['health'],
    },
    url: '/services/:name',
  });

  fastify.route({
    handler: async (request, reply) => {
      reply.status(StatusCodes.NO_CONTENT);
    },
    logLevel: 'debug',
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Shorthand for liveness probe',
      tags: ['health'],
    },
    url: '/probes/liveness',
  });

  fastify.route({
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
    logLevel: 'debug',
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([
          StatusCodes.SERVICE_UNAVAILABLE,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Shorthand for readiness probe',
      tags: ['health'],
    },
    url: '/probes/readiness',
  });
};

export default router;
