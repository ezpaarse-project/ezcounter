import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostModel } from '~/models/data-host';
import {
  DataHostSupportedReport,
  DataHostSupportedReportFilters,
} from '~/models/data-host/dto';
import { fetchSupportedReportsOfDataHost } from '~/models/data-host/supported-reports';
import { HarvestAuthOptions } from '~/models/harvest/dto';

import { assertReleaseSupported } from '~/routes/v1/data-hosts/utils';
import { PaginationQuery } from '~/routes/v1/query';
import {
  PaginationMeta,
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
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;
      const { count, order, page, sort, ...filters } = request.query;

      const [reports, total] = await DataHostModel.$transaction((dataHosts) =>
        Promise.all([
          dataHosts.findAllReportsSupported(
            { dataHostId: id, release },
            {
              ...filters,
              orderBy: { [sort || 'createdAt']: order },
              skip: count * (page - 1),
              take: count > 0 ? count : undefined,
            }
          ),
          dataHosts.countAllReportsSupported(
            { dataHostId: id, release },
            filters
          ),
        ])
      );

      return buildResponse(reply, reports, {
        count: reports.length,
        page,
        total,
      });
    },
    method: 'GET',
    preHandler: [
      (request): Promise<void> =>
        assertReleaseSupported({
          dataHostId: request.params.id,
          release: request.params.release,
        }),
    ],
    schema: {
      params: RouterParams,
      querystring: z.object({
        ...PaginationQuery.shape,
        ...DataHostSupportedReportFilters.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(
          z.array(DataHostSupportedReport),
          PaginationMeta
        ),
      },
      summary: 'Get supported reports of a data host for a release',
      tags: ['data-host'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;
      const { auth } = request.body;

      const dataHosts = new DataHostModel();
      const host = await dataHosts.findOneWithSupportedData(id);

      return buildResponse(
        reply,
        await fetchSupportedReportsOfDataHost(host, auth, release)
      );
    },
    method: 'POST',
    preHandler: [
      (request): Promise<void> =>
        assertReleaseSupported({
          dataHostId: request.params.id,
          release: request.params.release,
        }),
    ],
    schema: {
      body: z.object({
        auth: HarvestAuthOptions,
      }),
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(z.array(DataHostSupportedReport)),
      },
      summary: 'Fetch supported reports of a data host for a release',
      tags: ['data-host'],
    },
    url: '/_fetch',
  });
};

export default router;
