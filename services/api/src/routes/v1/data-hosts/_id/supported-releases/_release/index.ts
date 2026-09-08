import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z, zToArray } from '@ezcounter/dto';
import {
  DataHostAuthCheckOptions,
  DataHostAuthCheckResult,
} from '@ezcounter/dto/data-host';

import { DataHostModel } from '~/models/data-host';
import {
  DataHostSupportedRelease,
  DataHostSupportedReleaseInclude,
  UpdateDataHostSupportedRelease,
} from '~/models/data-host/dto';
import { HarvestAuthOptions } from '~/models/harvest/dto';

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
import { checkDataHostAuth } from '~/rpc/data-host/auth/check';

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
      const { includes } = request.query;

      const dataHosts = new DataHostModel();

      return buildResponse(
        reply,
        await dataHosts.findOneReleaseSupported(
          { dataHostId: id, release },
          includes
        )
      );
    },
    method: 'GET',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    schema: {
      params: RouterParams,
      querystring: z.object({
        includes: zToArray(DataHostSupportedReleaseInclude).optional(),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostSupportedRelease),
      },
      summary: 'Get a data host supported release',
      tags: ['data-host'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;

      const dataHosts = new DataHostModel();

      return buildResponse(
        reply,
        await dataHosts.upsertReleaseSupported({
          ...request.body,
          dataHostId: id,
          release,
        })
      );
    },
    method: 'PUT',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    schema: {
      body: UpdateDataHostSupportedRelease,
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostSupportedRelease),
      },
      summary: 'Create or update a supported releases for a data host',
      tags: ['data-host'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;

      const dataHosts = new DataHostModel();

      await dataHosts.deleteReleaseSupported({ dataHostId: id, release });

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
    method: 'DELETE',
    preHandler: [
      (request): Promise<void> => assertDataHostRegistered(request.params.id),
    ],
    schema: {
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Remove a supported release for a data host',
      tags: ['data-host'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;
      const {
        dataHost: { auth },
        ...options
      } = request.body;

      const [dataHost, supportedRelease] = await DataHostModel.$transaction(
        (dataHosts) =>
          Promise.all([
            dataHosts.findOne(id),
            dataHosts.findOneReleaseSupported({ dataHostId: id, release }),
          ])
      );

      return buildResponse(
        reply,
        await checkDataHostAuth({
          ...options,
          dataHost: {
            auth,
            baseUrl: supportedRelease.baseUrl,
            paramsSeparator: supportedRelease.paramsSeparator,
            periodFormat: supportedRelease.periodFormat,
          },
          release,
          report: {
            ...options.report,
            params: {
              ...dataHost.params,
              ...supportedRelease.params,
              ...options.report.params,
            },
          },
        })
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
        ...DataHostAuthCheckOptions.omit({ release: true }).shape,

        dataHost: z.object({
          auth: HarvestAuthOptions.describe('Credentials to check'),
        }),
      }),
      params: RouterParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostAuthCheckResult),
      },
      summary: 'Check auth credentials of a data host',
      tags: ['data-host'],
    },
    url: '/_check-auth',
  });
};

export default router;
