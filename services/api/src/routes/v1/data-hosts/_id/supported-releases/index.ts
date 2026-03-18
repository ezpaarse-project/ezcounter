import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/models/lib/zod';

import { findAllReleasesSupportedByDataHost } from '~/models/data-host';
import { DataHostSupportedRelease } from '~/models/data-host/types';

import { assertDataHostRegistered } from '~/routes/v1/data-hosts/utils';
import {
  buildResponse,
  describeSuccess,
  describeErrors,
} from '~/routes/v1/responses';

/**
 * Validation for URL params common for this router (based on filepath)
 */
const RouterParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get supported releases of a data host',
      tags: ['data-host'],
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHostSupportedRelease)),
      },
    },
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    handler: async (request, reply) => {
      const { id } = request.params;

      return buildResponse(reply, await findAllReleasesSupportedByDataHost(id));
    },
  });
};

export default router;
