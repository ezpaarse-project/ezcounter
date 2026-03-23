import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import {
  deleteReportSupportedByDataHost,
  upsertReportSupportedByDataHost,
} from '~/models/data-host';
import {
  DataHostSupportedReport,
  InputDataHostSupportedReport,
} from '~/models/data-host/dto';

import {
  assertDataHostRegistered,
  assertReleaseSupported,
} from '~/routes/v1/data-hosts/utils';
import {
  buildResponse,
  describeSuccess,
  describeErrors,
  EmptyResponse,
} from '~/routes/v1/responses';

/**
 * Validation for URL params common for this router (based on filepath)
 */
const RouterParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
  release: z.literal(['5', '5.1']).describe('Release'),
  report: z.string().describe('Report ID'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'PUT',
    url: '/',
    schema: {
      summary:
        'Create or update a supported report of a data host for a release',
      tags: ['data-host'],
      params: RouterParams,
      body: InputDataHostSupportedReport,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostSupportedReport),
      },
    },
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
      (request): Promise<void> =>
        assertReleaseSupported(request.params.id, request.params.release),
    ],
    handler: async (request, reply) => {
      const { id, release, report } = request.params;

      return buildResponse(
        reply,
        await upsertReportSupportedByDataHost({
          ...request.body,
          dataHostId: id,
          release,
          id: report,
        })
      );
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/',
    schema: {
      summary: 'Delete supported report of a data host for a release',
      tags: ['data-host'],
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: EmptyResponse,
      },
    },
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
      (request): Promise<void> =>
        assertReleaseSupported(request.params.id, request.params.release),
    ],
    handler: async (request, reply) => {
      const { id, release, report } = request.params;

      await deleteReportSupportedByDataHost(id, release, report);

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
  });
};

export default router;
