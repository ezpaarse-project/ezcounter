import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostModel } from '~/models/data-host';
import {
  DataHostSupportedReport,
  UpdateDataHostSupportedReport,
} from '~/models/data-host/dto';

import { assertReleaseSupported } from '~/routes/v1/data-hosts/utils';
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
  report: z.string().toLowerCase().describe('Report ID'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id, release, report } = request.params;

      const reportIdentifier = {
        dataHostId: id,
        release,
        report,
      };

      const dataHost = await DataHostModel.$transaction(async (dataHosts) => {
        let previous: UpdateDataHostSupportedReport = {
          firstMonthAvailable: '',
          lastMonthAvailable: '',
          params: {},
          supported: false,
        };

        if (await dataHosts.doesSupportsReport(reportIdentifier)) {
          previous = await dataHosts.findOneReportSupported(reportIdentifier);
        }

        return dataHosts.upsertReportSupported({
          ...previous,
          ...request.body,
          dataHostId: id,
          id: report,
          release,
        });
      });

      return buildResponse(reply, dataHost);
    },
    method: 'PUT',
    preHandler: [
      (request): Promise<void> =>
        assertReleaseSupported({
          dataHostId: request.params.id,
          release: request.params.release,
        }),
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

      const dataHosts = new DataHostModel();

      await dataHosts.deleteReportSupported({
        dataHostId: id,
        release,
        report,
      });

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
    method: 'DELETE',
    preHandler: [
      (request): Promise<void> =>
        assertReleaseSupported({
          dataHostId: request.params.id,
          release: request.params.release,
        }),
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
