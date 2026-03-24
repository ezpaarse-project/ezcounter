import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';

import {
  createManyHarvestJob,
  failManyHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
} from '~/models/harvest';
import { HarvestJob, CreateHarvestRequest } from '~/models/harvest/dto';
import { prepareHarvestJobs } from '~/models/harvest/prepare';

import { queueHarvestJobs } from '~/queues/harvest/dispatch';
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
      summary: 'Get harvest jobs',
      tags: ['harvest'],
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: describeSuccess(z.array(HarvestJob)),
      },
    },
    handler: async (request, reply) =>
      buildResponse(reply, await findAllHarvestJob()),
  });

  fastify.route({
    method: 'POST',
    url: '/_bulk',
    schema: {
      summary: 'Create multiple harvest jobs from multiple harvest requests',
      tags: ['harvest'],
      body: z.array(CreateHarvestRequest).min(1),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: describeSuccess(z.array(HarvestJob)),
      },
    },
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
          .map(({ id, error }) => (error ? { id, error } : null))
          .filter((job) => !!job)
      );

      reply.statusCode = StatusCodes.CREATED;
      return buildResponse(
        reply,
        await findManyHarvestJobById(queued.map(({ id }) => id))
      );
    },
  });
};

export default router;
