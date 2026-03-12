import { randomUUID } from 'node:crypto';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import type { HarvestJobData } from '@ezcounter/models/queues';
import { z } from '@ezcounter/models/lib/zod';

import {
  createManyHarvestJob,
  failManyHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
} from '~/models/harvest';
import { HarvestJob, HarvestRequest } from '~/models/harvest/types';
import { splitPeriodByMonths } from '~/models/harvest/utils';

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
      body: z.array(HarvestRequest).min(1),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.CREATED]: describeSuccess(z.array(HarvestJob)),
      },
    },
    handler: async (request, reply) => {
      const jobs: HarvestJobData[] = [];

      for (const harvestOpts of request.body) {
        // Resolve reports
        const { reports, ...downloadOpts } = harvestOpts.download;

        for (const { splitPeriodBy, ...reportOpts } of reports) {
          // Resolve periods
          const parts = splitPeriodByMonths(
            reportOpts.period,
            splitPeriodBy || 0
          );

          for (const period of parts) {
            jobs.push({
              ...harvestOpts,
              id: randomUUID(),
              download: {
                ...downloadOpts,
                report: {
                  ...reportOpts,
                  period,
                },
              },
            });
          }
        }
      }

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
