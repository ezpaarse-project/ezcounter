import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { findAllReportsSupportedByDataHost } from '~/models/data-host';
import { DataHostSupportedReport } from '~/models/data-host/dto';

import {
  assertDataHostRegistered,
  assertReleaseSupported,
} from '~/routes/v1/data-hosts/utils';
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
  release: z.literal(['5', '5.1']).describe('Release'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;

      return buildResponse(
        reply,
        await findAllReportsSupportedByDataHost(id, release)
      );
    },
    method: 'GET',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
      (request): Promise<void> =>
        assertReleaseSupported(request.params.id, request.params.release),
    ],
    schema: {
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHostSupportedReport)),
      },
      summary: 'Get supported reports of a data host for a release',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
