import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostModel } from '~/models/data-host';
import {
  DataHostSupportedRelease,
  DataHostSupportedReleaseFilters,
} from '~/models/data-host/dto';

import { assertDataHostRegistered } from '~/routes/v1/data-hosts/utils';
import { PaginationQuery } from '~/routes/v1/query';
import {
  PaginationMeta,
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
      const { count, order, page, sort, ...filters } = request.query;

      const [releases, total] = await DataHostModel.$transaction((dataHosts) =>
        Promise.all([
          dataHosts.findAllReleasesSupported(id, {
            ...filters,
            orderBy: { [sort || 'createdAt']: order },
            skip: count * (page - 1),
            take: count > 0 ? count : undefined,
          }),
          dataHosts.countAllReleasesSupported(id, filters),
        ])
      );

      return buildResponse(reply, releases, {
        count: releases.length,
        page,
        total,
      });
    },
    method: 'GET',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    schema: {
      params: RouterParams,
      querystring: z.object({
        ...PaginationQuery.shape,
        ...DataHostSupportedReleaseFilters.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(
          z.array(DataHostSupportedRelease),
          PaginationMeta
        ),
      },
      summary: 'Get supported releases of a data host',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
