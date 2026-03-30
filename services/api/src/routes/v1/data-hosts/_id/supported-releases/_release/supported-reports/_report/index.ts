import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import {
  deleteReportSupportedByDataHost,
  findOneReportSupportedByDataHost,
  upsertReportSupportedByDataHost,
} from '~/models/data-host';
import {
  DataHostSupportedReport,
  UpdateDataHostSupportedReport,
} from '~/models/data-host/dto';

import {
  assertDataHostRegistered,
  assertReleaseSupported,
} from '~/routes/v1/data-hosts/utils';
import {
  EmptyResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
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
    handler: async (request, reply) => {
      const { id, release, report } = request.params;

      const previous = (await findOneReportSupportedByDataHost(
        id,
        release,
        report
      )) ?? {
        firstMonthAvailable: '',
        lastMonthAvailable: '',
        supported: false,
      };

      return buildResponse(
        reply,
        await upsertReportSupportedByDataHost({
          ...previous,
          ...request.body,
          dataHostId: id,
          id: report,
          release,
        })
      );
    },
    method: 'PUT',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
      (request): Promise<void> =>
        assertReleaseSupported(request.params.id, request.params.release),
    ],
    schema: {
      body: UpdateDataHostSupportedReport,
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostSupportedReport),
      },
      summary:
        'Create or update a supported report of a data host for a release',
      tags: ['data-host'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release, report } = request.params;

      await deleteReportSupportedByDataHost(id, release, report);

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
    method: 'DELETE',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
      (request): Promise<void> =>
        assertReleaseSupported(request.params.id, request.params.release),
    ],
    schema: {
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: EmptyResponse,
      },
      summary: 'Delete supported report of a data host for a release',
      tags: ['data-host'],
    },
    url: '/',
  });
};

export default router;
