import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { upsertDataHost, deleteDataHost } from '~/models/data-host';
import { UpdateDataHost, DataHost } from '~/models/data-host/dto';

import {
  describeErrors,
  describeSuccess,
  buildResponse,
  EmptyResponse,
} from '~/routes/v1/responses';

/**
 * Validation for URL params common for this router (based on filepath)
 */
const RouterParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'PUT',
    url: '/',
    schema: {
      summary: 'Create or update a data host',
      tags: ['data-host'],
      params: RouterParams,
      body: UpdateDataHost,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHost),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      return buildResponse(
        reply,
        await upsertDataHost({
          ...request.body,
          id,
        })
      );
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/',
    schema: {
      summary: 'Remove a supported release for a data host',
      tags: ['data-host'],
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      await deleteDataHost(id);

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
  });
};

export default router;
