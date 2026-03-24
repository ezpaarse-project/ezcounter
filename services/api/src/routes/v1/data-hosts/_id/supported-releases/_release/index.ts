import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import {
  deleteReleaseSupportedByDataHost,
  upsertReleaseSupportedByDataHost,
} from '~/models/data-host';
import {
  DataHostSupportedRelease,
  UpdateDataHostSupportedRelease,
} from '~/models/data-host/dto';

import { assertDataHostRegistered } from '~/routes/v1/data-hosts/utils';
import {
  buildResponse,
  describeSuccess,
  describeErrors,
  EmptyResponse,
} from '~/routes/v1/responses';

/**
 * Validation for URL params common for this router (based on filepath)
 */
const RouterParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
  release: z.literal(['5', '5.1']).describe('Release'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'PUT',
    url: '/',
    schema: {
      summary: 'Create or update a supported releases for a data host',
      tags: ['data-host'],
      params: RouterParams,
      body: UpdateDataHostSupportedRelease,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostSupportedRelease),
      },
    },
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    handler: async (request, reply) => {
      const { id, release } = request.params;

      return buildResponse(
        reply,
        await upsertReleaseSupportedByDataHost({
          ...request.body,
          dataHostId: id,
          release,
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
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    handler: async (request, reply) => {
      const { id, release } = request.params;

      await deleteReleaseSupportedByDataHost(id, release);

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
  });
};

export default router;
