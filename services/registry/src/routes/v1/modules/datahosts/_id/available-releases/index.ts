import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostReleaseModel } from '~/models/datahost-release';
import { DataHostRelease } from '~/models/datahost-release/dto';

import { assertDataHostRegistered } from '~/routes/v1/modules/datahosts/utils';
import { PaginationQuery } from '~/routes/v1/shared/query';
import {
  PaginationMeta,
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
      const { count, order, page, sort } = request.query;

      const [results, total] = await DataHostReleaseModel.$transaction(
        (releases) =>
          Promise.all([
            releases.findAll(id, {
              orderBy: { [sort || 'createdAt']: order },
              skip: count * (page - 1),
              take: count > 0 ? count : undefined,
            }),
            releases.countAll(id, null),
          ])
      );

      return buildResponse(reply, results, {
        count: results.length,
        page,
        total,
      });
    },
    method: 'GET',
    preHandler: [
      ({ params }): Promise<void> => assertDataHostRegistered(params.id),
    ],
    schema: {
      params: ModuleParams,
      querystring: z.object({
        ...PaginationQuery.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(
          z.array(DataHostRelease),
          PaginationMeta
        ),
      },
      summary: 'Get available releases of a data host',
      tags: ['datahost'],
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.registerModule('/:release', import('./_release'));

  await fastify.register(routes);
};
