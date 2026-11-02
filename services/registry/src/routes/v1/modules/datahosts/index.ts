import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostModel } from '~/models/datahost';
import { CreateDataHost, DataHost } from '~/models/datahost/dto';

import { PaginationQuery } from '~/routes/v1/shared/query';
import {
  PaginationMeta,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/shared/responses';

// Routes of the module
export const routes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { count, order, page, sort } = request.query;

      const [hosts, total] = await DataHostModel.$transaction((dataHosts) =>
        Promise.all([
          dataHosts.findAll({
            orderBy: { [sort || 'createdAt']: order },
            skip: count * (page - 1),
            take: count > 0 ? count : undefined,
          }),
          dataHosts.countAll(null),
        ])
      );

      return buildResponse(reply, hosts, { count: hosts.length, page, total });
    },
    method: 'GET',
    schema: {
      querystring: z.object({
        ...PaginationQuery.shape,
      }),
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHost), PaginationMeta),
      },
      summary: 'Get data hosts',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const dataHosts = new DataHostModel();

      return buildResponse(reply, await dataHosts.createLocal(request.body));
    },
    method: 'POST',
    schema: {
      body: CreateDataHost.omit({ local: true }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHost),
      },
      summary: 'Create a local data host',
      tags: ['datahost'],
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.registerModule('/:id', import('./_id'));

  await fastify.register(router);
};
