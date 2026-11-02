import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostModel } from '~/models/datahost';
import { DataHost, UpdateDataHost } from '~/models/datahost/dto';

import { assertDataHostRegistered } from '~/routes/v1/modules/datahosts/utils';
import {
  EmptyResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/shared/responses';

/**
 * Validation for URL params common for this module (based on filepath)
 */
const ModuleParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
});

// Routes of the module
export const routes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id } = request.params;

      const dataHosts = new DataHostModel();

      return buildResponse(reply, await dataHosts.findOne(id));
    },
    method: 'GET',
    preHandler: [
      ({ params }): Promise<void> => assertDataHostRegistered(params.id),
    ],
    schema: {
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHost),
      },
      summary: 'Get a data host',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id } = request.params;

      const dataHosts = new DataHostModel();

      return buildResponse(
        reply,
        await dataHosts.updateLocal({
          ...request.body,
          id,
        })
      );
    },
    method: 'PUT',
    preHandler: [
      ({ params }): Promise<void> => assertDataHostRegistered(params.id),
    ],
    schema: {
      body: UpdateDataHost.omit({ id: true }),
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHost),
      },
      summary: 'Update a data host by creating a local change',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id } = request.params;

      const dataHosts = new DataHostModel();

      await dataHosts.delete(id);

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
    method: 'DELETE',
    schema: {
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Remove a data host',
      tags: ['datahost'],
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.registerModule(
    '/available-releases',
    import('./available-releases')
  );

  await fastify.register(routes);
};
