import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';
import { RouteResponseWithRegistry } from '@ezcounter/dto/registry';

// oxlint-disable-next-line import/extensions
import { version as appVersion } from '~/../package.json' with { type: 'json' };

import {
  buildResponse,
  describeErrors,
  describeSuccess,
} from '../shared/responses';

// Routes of the module
export const routes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) =>
      buildResponse(reply, {
        description: 'COUNTER Registry for ezCOUNTER',
        ezcRegistry: {
          baseURL: new URL(request.host).href,
          // TODO: do the counts
          hosts: 0,
          version: appVersion,
        },
        name: 'ezCOUNTER Registry',
        version: appVersion,
      }),
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(
          z.object({
            ...RouteResponseWithRegistry.shape,

            description: z.string(),
            name: z.string(),
            version: z.string(),
          })
        ),
      },
      summary: 'API root',
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(router);
};
