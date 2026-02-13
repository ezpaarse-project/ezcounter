import { join } from 'node:path';

import { StatusCodes } from 'http-status-codes';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import autoLoad from '@fastify/autoload';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';

import { openapiPlugin } from '~/plugins/openapi';

import { buildResponse } from './v1/responses';
import { HTTPError } from './v1/errors';

/**
 * Prepare validation, error handling, etc.
 *
 * @param fastify - The fastify instance
 */
export function setupResponses(fastify: FastifyInstance): void {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Handle errors
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  fastify.setErrorHandler((err, req, reply) => {
    // Unknown error
    if (!(err instanceof Error)) {
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`${err}`);
    }

    // If it's a request validation error
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.status(StatusCodes.BAD_REQUEST).send(
        buildResponse(
          reply,
          new Error("Request doesn't match the schema", {
            cause: {
              issues: err.validation,
              context: err.validationContext,
            },
          })
        )
      );
    }

    // If it's a response validation error
    if (isResponseSerializationError(err)) {
      return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        buildResponse(
          reply,
          new Error(
            "Response doesn't match the schema. Please contact the administrators",
            {
              cause: {
                issues: err.cause.issues,
                context: 'response',
              },
            }
          )
        )
      );
    }

    // Send error
    const status =
      err instanceof HTTPError
        ? err.statusCode
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return reply.status(status).send(buildResponse(reply, err));
  });

  // Handle not found
  fastify.setNotFoundHandler(() => {
    throw new HTTPError(StatusCodes.NOT_FOUND, 'Route not found');
  });
}

/**
 * Fastify Plugin that register routes for the API v1
 *
 * @param fastify - The fastify instance
 */
export const v1: FastifyPluginAsync = async (fastify) => {
  // Prepare validation, error handling, etc.
  setupResponses(fastify);

  // Register openapi and doc
  fastify.register(openapiPlugin, { transform: jsonSchemaTransform });

  // Register routes
  fastify.register(autoLoad, {
    dir: join(import.meta.dirname, 'v1'),
    // Avoid importing test files
    ignorePattern: /^.*test.ts$/,
    routeParams: true,
    maxDepth: 2,
  });
};
