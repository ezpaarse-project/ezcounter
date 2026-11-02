import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostReportModel } from '~/models/datahost-report';
import {
  CreateDataHostReport,
  DataHostReport,
  UpdateDataHostReport,
} from '~/models/datahost-report/dto';

import {
  assertReleaseRegistered,
  assertReportRegistered,
} from '~/routes/v1/modules/datahosts/utils';
import {
  EmptyResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
} from '~/routes/v1/shared/responses';

/**
 * Validation for URL params common for this module (based on filepath)
 */
const ModuleParams = z.object({
  id: z.string().min(1).describe('ID of the data host'),
  release: z.literal(['5', '5.1']).describe('Release'),
  reportId: z.string().toLowerCase().describe('Report ID'),
});

// Routes of the module
export const routes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id, release, reportId } = request.params;

      const reports = new DataHostReportModel();

      return buildResponse(
        reply,
        await reports.findOne({ dataHostId: id, release, reportId })
      );
    },
    method: 'GET',
    preHandler: [
      ({ params }): Promise<void> =>
        assertReportRegistered({
          dataHostId: params.id,
          release: params.release,
          reportId: params.reportId,
        }),
    ],
    schema: {
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostReport),
      },
      summary: 'Get a available release for a data host',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release, reportId } = request.params;

      const reports = new DataHostReportModel();

      const exists = await reports.doesExists({
        dataHostId: id,
        release,
        reportId,
      });

      const result = exists
        ? await reports.updateLocal({
            ...request.body,
            dataHostId: id,
            release,
            reportId,
          })
        : await reports.createLocal({
            ...request.body,
            dataHostId: id,
            release,
            reportId,
          });

      if (!exists) {
        reply.status(StatusCodes.CREATED);
      }

      return buildResponse(reply, result);
    },
    method: 'PUT',
    preHandler: [
      ({ params }): Promise<void> =>
        assertReleaseRegistered({
          dataHostId: params.id,
          release: params.release,
        }),
    ],
    schema: {
      body: z.intersection(
        CreateDataHostReport.omit({
          dataHostId: true,
          release: true,
          reportId: true,
        }),
        UpdateDataHostReport.omit({
          dataHostId: true,
          release: true,
          reportId: true,
        })
      ),
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(DataHostReport),
      },
      summary:
        'Create or update a supported report of a data host for a release',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release, reportId } = request.params;

      const reports = new DataHostReportModel();

      await reports.delete({
        dataHostId: id,
        release,
        reportId,
      });

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
    method: 'DELETE',
    preHandler: [
      ({ params }): Promise<void> =>
        assertReleaseRegistered({
          dataHostId: params.id,
          release: params.release,
        }),
    ],
    schema: {
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: EmptyResponse,
      },
      summary: 'Delete supported report of a data host for a release',
      tags: ['datahost'],
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(routes);
};
