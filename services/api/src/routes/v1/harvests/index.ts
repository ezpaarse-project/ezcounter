import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import {
  createManyHarvestJob,
  failManyHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
} from '~/models/harvest';
import { CreateHarvestRequest, HarvestJob } from '~/models/harvest/dto';
import { prepareHarvestJobs } from '~/models/harvest/prepare';

import { queueHarvestJobs } from '~/queues/harvest/dispatch';
import {
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
      // oxlint-disable-next-line promise/prefer-await-to-then
      const jobsPerRequest = await Promise.all(
        request.body.map((req) => prepareHarvestJobs(req))
      );

      const jobs = jobsPerRequest.flat();
      await createManyHarvestJob(jobs);
      const queued = await queueHarvestJobs(jobs);

      // Mark as failed jobs that weren't queued
      await failManyHarvestJob(
        queued
          .map(({ id, error }) => (error ? { error, id } : null))
          // oxlint-disable-next-line no-implicit-coercion - Type guard fails with Boolean
          .filter((job) => !!job)
      );

      reply.statusCode = StatusCodes.CREATED;
      return buildResponse(
        reply,
        await findManyHarvestJobById(queued.map(({ id }) => id))
      );
    },
    method: 'POST',
    schema: {
      body: z.array(CreateHarvestRequest).min(1),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: describeSuccess(z.array(HarvestJob)),
      },
      summary: 'Create multiple harvest jobs from multiple harvest requests',
      tags: ['harvest'],
    },
    url: '/_bulk',
  });
};

export default router;
