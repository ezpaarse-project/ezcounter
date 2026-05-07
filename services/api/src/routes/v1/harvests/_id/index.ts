import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { findManyHarvestJobById } from '~/models/harvest';
import { HarvestJob } from '~/models/harvest/dto';

import {
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

import { HTTPError } from '../../errors';

/**
 * Validation for URL params common for this router (based on filepath)
 */
const RouterParams = z.object({
  id: z.string().min(1).describe('ID of the harvest job'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id } = request.params;

      const [job] = await findManyHarvestJobById([id]);
      if (!job) {
        throw new HTTPError(
          StatusCodes.NOT_FOUND,
          `Harvest job ${id} not found`
        );
      }

      return buildResponse(reply, job);
    },
    method: 'GET',
    schema: {
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(HarvestJob),
      },
      summary: 'Get specific harvest job',
      tags: ['harvest'],
    },
    url: '/',
  });
};

export default router;
