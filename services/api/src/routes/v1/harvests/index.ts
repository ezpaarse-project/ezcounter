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
      queueHarvestRequest(request.body);

      reply.statusCode = StatusCodes.CREATED;
    },
    method: 'POST',
    schema: {
      body: HarvestRequestData,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: EmptyResponse,
      },
      summary: 'Queue an harvest request',
      tags: ['harvest'],
    },
    url: '/_bulk',
  });
};

export default router;
