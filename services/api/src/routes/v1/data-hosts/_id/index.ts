import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z, zToArray } from '@ezcounter/dto';

import { DataHostModel } from '~/models/data-host';
import {
  DataHost,
  DataHostInclude,
  UpdateDataHost,
} from '~/models/data-host/dto';

import {
  EmptyResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

/**
 * Validation for URL params common for this router (based on filepath)
 */
const RouterParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id } = request.params;
      const { include } = request.query;

      const dataHosts = new DataHostModel();

      return buildResponse(reply, await dataHosts.findOne(id, include));
    },
    method: 'GET',
    schema: {
      params: RouterParams,
      querystring: z.object({
        include: zToArray(DataHostInclude).optional(),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHost),
      },
      summary: 'Get a data host',
      tags: ['data-host'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id } = request.params;

      const dataHosts = new DataHostModel();

      return buildResponse(
        reply,
        await dataHosts.upsert({
          ...request.body,
          id,
        })
      );
    },
    method: 'PUT',
    schema: {
      body: UpdateDataHost,
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHost),
      },
      summary: 'Create or update a data host',
      tags: ['data-host'],
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
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Remove a data host',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
