import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z, zToArray } from '@ezcounter/dto';

import { DataHostModel } from '~/models/data-host';
import {
  DataHost,
  DataHostFilters,
  DataHostInclude,
} from '~/models/data-host/dto';

import {
  PaginationMeta,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

import { PaginationQuery } from '../query';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { count, order, page, sort, includes, ...filters } = request.query;

      const [hosts, total] = await DataHostModel.$transaction((dataHosts) =>
        Promise.all([
          dataHosts.findAll({
            ...filters,
            includes,
            orderBy: { [sort || 'createdAt']: order },
            skip: count * (page - 1),
            take: count > 0 ? count : undefined,
          }),
          dataHosts.countAll(filters),
        ])
      );

      return buildResponse(reply, hosts, { count: hosts.length, page, total });
    },
    method: 'GET',
    schema: {
      querystring: z.object({
        ...PaginationQuery.shape,
        ...DataHostFilters.shape,
        includes: zToArray(DataHostInclude),
      }),
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHost), PaginationMeta),
      },
      summary: 'Get data hosts',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
