import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { findAllDataHost } from '~/models/data-host';
import { DataHost } from '~/models/data-host/dto';

import {
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) =>
      buildResponse(reply, await findAllDataHost()),
    method: 'GET',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHost)),
      },
      summary: 'Get data hosts',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
