import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';
import { HarvestRequestData } from '@ezcounter/dto/queues';

import { findAllHarvestJob } from '~/models/harvest';
import { HarvestJob } from '~/models/harvest/dto';

import { queueHarvestRequest } from '~/queues/harvest/request';
import {
  EmptyResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) =>
      buildResponse(reply, await findAllHarvestJob()),
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(HarvestJob)),
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
