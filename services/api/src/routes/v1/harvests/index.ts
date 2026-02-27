import { randomUUID } from 'node:crypto';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/models/lib/zod';

import type { HarvestJobData } from '@ezcounter/models/queues';

import {
  createManyHarvestJob,
  failManyHarvestJob,
  splitPeriodByMonths,
} from '~/models/harvest';
import { HarvestJob, HarvestRequest } from '~/models/harvest/types';

import { queueHarvestJobs } from '~/queues/harvest/dispatch';

import {
  buildResponse,
  describeSuccess,
  describeErrors,
} from '~/routes/v1/responses';

const router: FastifyPluginAsyncZod = async (fastify) => {
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

              download: {
                ...downloadOpts,

                report: {
                  ...reportOpts,
                  period,
                },
              },

              id: randomUUID(),
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
      return buildResponse(reply, []);
    },
  });
};

export default router;
