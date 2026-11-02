import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import { DataHostReleaseModel } from '~/models/datahost-release';
import {
  CreateDataHostRelease,
  DataHostRelease,
  UpdateDataHostRelease,
} from '~/models/datahost-release/dto';

import {
  assertDataHostRegistered,
  assertReleaseRegistered,
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
});

// Routes of the module
export const routes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;

      const releases = new DataHostReleaseModel();

      return buildResponse(
        reply,
        await releases.findOne({ dataHostId: id, release })
      );
    },
    method: 'GET',
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
        [StatusCodes.OK]: describeSuccess(DataHostRelease),
      },
      summary: 'Get a available release for a data host',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;

      const releases = new DataHostReleaseModel();

      const exists = await releases.doesExists({
        dataHostId: id,
        release,
      });

      const result = exists
        ? await releases.updateLocal({
            ...request.body,
            dataHostId: id,
            release,
          })
        : await releases.createLocal({
            ...request.body,
            dataHostId: id,
            release,
          });

      if (!exists) {
        reply.status(StatusCodes.CREATED);
      }

      return buildResponse(reply, result);
    },
    method: 'PUT',
    preHandler: [
      ({ params }): Promise<void> => assertDataHostRegistered(params.id),
    ],
    schema: {
      body: z.intersection(
        CreateDataHostRelease.omit({ dataHostId: true, release: true }),
        UpdateDataHostRelease.omit({ dataHostId: true, release: true })
      ),
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: describeSuccess(DataHostRelease),
        [StatusCodes.OK]: describeSuccess(DataHostRelease),
      },
      summary: 'Create or Update a available release for a data host',
      tags: ['datahost'],
    },
    url: '/',
  });

  fastify.route({
    handler: async (request, reply) => {
      const { id, release } = request.params;

      const releases = new DataHostReleaseModel();

      await releases.delete({ dataHostId: id, release });

      reply.statusCode = StatusCodes.NO_CONTENT;
    },
    method: 'DELETE',
    preHandler: [
      ({ params }): Promise<void> => assertDataHostRegistered(params.id),
    ],
    schema: {
      params: ModuleParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Remove a available release for a data host',
      tags: ['datahost'],
    },
    url: '/',
  });
};

// Router of the module (routes + sub-modules)
export const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.registerModule(
    '/available-reports',
    import('./available-reports')
  );

  await fastify.register(routes);
};
