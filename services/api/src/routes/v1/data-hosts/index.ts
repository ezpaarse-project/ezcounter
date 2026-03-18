import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/models/lib/zod';

import { findAllDataHost } from '~/models/data-host';
import { DataHost } from '~/models/data-host/types';

import {
  buildResponse,
  describeSuccess,
  describeErrors,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get data hosts',
      tags: ['data-host'],
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHost)),
      },
    },
    handler: async (request, reply) =>
      buildResponse(reply, await findAllDataHost()),
  });
};

export default router;
