import { Readable } from 'node:stream';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import multipart from '@fastify/multipart';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezcounter/dto';
import { ReportValidationResult } from '@ezcounter/dto/validate';

import { validateCOUNTERReport } from '~/rpc/report/validate';

import { buildResponse, describeErrors, describeSuccess } from '../responses';

// Registering validation route in it's own plugin as it needs multipart
const validationRoute: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(multipart, { attachFieldsToBody: true });

  fastify.route({
    config: {
      multipartOptions: {
        limits: {
          // 1 GB
          fileSize: 1_000_000_000,
        },
      },
    },
    handler: async (request, reply) => {
      const { report: file, release, reportId } = request.body;

      const stream =
        file instanceof File
          ? Readable.fromWeb(file.stream())
          : Readable.from(Buffer.from(JSON.stringify(file)));

      const result = await validateCOUNTERReport(stream, { release, reportId });

      return buildResponse(reply, result);
    },
    method: 'POST',
    preValidation: async (request) => {
      // Parse request body into JSON if FormData is used
      if (request.isMultipart()) {
        const formData = await request.formData();
        request.setDecorator('body', Object.fromEntries(formData.entries()));
      }
    },
    schema: {
      body: z.object({
        release: z.literal(['5', '5.1']).describe('COUNTER release to use'),
        report: z.union([z.json(), z.file()]).describe('Report file'),
        reportId: z.string().toLowerCase().describe('Report ID to expect'),
      }),
      consumes: ['multipart/form-data', 'application/json'],
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: describeSuccess(ReportValidationResult),
      },
      summary: 'Tries to validate body as a COUNTER report',
      tags: ['reports'],
    },
    url: '/_validate',
  });
};

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(validationRoute);
};

export default router;
