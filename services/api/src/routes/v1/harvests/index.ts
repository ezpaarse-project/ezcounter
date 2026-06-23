import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';
import { HarvestRequestData } from '@ezcounter/dto/queues';

import { HarvestJobModel } from '~/models/harvest';
import { HarvestJob, HarvestJobFilters } from '~/models/harvest/dto';

import { queueHarvestRequest } from '~/queues/harvest/request';
import { PaginationQuery } from '~/routes/v1/query';
import {
  PaginationMeta,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { count, order, page, sort, ...filters } = request.query;

      const [jobs, total] = await HarvestJobModel.$transaction((harvestJobs) =>
        Promise.all([
          harvestJobs.findAll({
            ...filters,
            orderBy: { [sort || 'createdAt']: order },
            skip: count * (page - 1),
            take: count > 0 ? count : undefined,
          }),
          harvestJobs.countAll(filters),
        ])
      );

      return buildResponse(reply, jobs, { count: jobs.length, page, total });
    },
    method: 'GET',
    schema: {
      querystring: z.object({
        ...PaginationQuery.shape,
        ...HarvestJobFilters.shape,
      }),
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(HarvestJob), PaginationMeta),
      },
      summary: 'Get harvest jobs',
      tags: ['harvest'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { requestId } = request.query;

      reply.statusCode = StatusCodes.CREATED;
      return buildResponse(reply, {
        requestId: await queueHarvestRequest(request.body, requestId),
      });
    },
    method: 'POST',
    schema: {
      body: HarvestRequestData,
      querystring: z.object({
        requestId: z
          .string()
          .optional()
          .describe('ID of the request, is generated if not present'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: describeSuccess(
          z.object({
            requestId: z
              .string()
              .describe('ID of the request, can be used to get jobs created'),
          })
        ),
      },
      summary: 'Queue an harvest request',
      tags: ['harvest'],
    },
    url: '/_bulk',
  });
};

export default router;
