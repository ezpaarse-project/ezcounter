import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostReportModel } from '~/models/datahost-report';
import { DataHostReport } from '~/models/datahost-report/dto';

import { assertReleaseRegistered } from '~/routes/v1/modules/datahosts/utils';
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
  release: z.literal(['5', '5.1']).describe('Release'),
});

// Routes of the module
export const routes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;
      const { count, order, page, sort } = request.query;

      const [results, total] = await DataHostReportModel.$transaction(
        (reports) =>
          Promise.all([
            reports.findAll(
              { dataHostId: id, release },
              {
                orderBy: { [sort || 'createdAt']: order },
                skip: count * (page - 1),
                take: count > 0 ? count : undefined,
              }
            ),
            reports.countAll({ dataHostId: id, release }, null),
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
      ({ params }): Promise<void> =>
        assertReleaseRegistered({
          dataHostId: params.id,
          release: params.release,
        }),
    ],
    schema: {
      params: ModuleParams,
      querystring: z.object({
        ...PaginationQuery.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(
          z.array(DataHostReport),
          PaginationMeta
        ),
      },
      summary: 'Get supported reports of a data host for a release',
      tags: ['datahost'],
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.registerModule('/:reportId', import('./_reportId'));

  await fastify.register(routes);
};
