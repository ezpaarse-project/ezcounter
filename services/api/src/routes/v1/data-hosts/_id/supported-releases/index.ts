import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { findAllReleasesSupportedByDataHost } from '~/models/data-host';
import { DataHostSupportedRelease } from '~/models/data-host/dto';

import { assertDataHostRegistered } from '~/routes/v1/data-hosts/utils';
import {
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

      return buildResponse(reply, await findAllReleasesSupportedByDataHost(id));
    },
    method: 'GET',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    schema: {
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHostSupportedRelease)),
      },
      summary: 'Get supported releases of a data host',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
