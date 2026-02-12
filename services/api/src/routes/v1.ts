import { join } from 'node:path';

import { StatusCodes } from 'http-status-codes';
import type { FastifyPluginAsync } from 'fastify';
import autoLoad from '@fastify/autoload';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { openapiPlugin } from '~/plugins/openapi';

import { buildResponse } from './v1/responses';
import { HTTPError } from './v1/errors';

export const v1: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register openapi and doc
  app.register(openapiPlugin, { transform: jsonSchemaTransform });

  // Handle errors
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  app.setErrorHandler((err, req, reply) => {
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
  app.setNotFoundHandler(() => {
    throw new HTTPError(StatusCodes.NOT_FOUND, 'Route not found');
  });

  // Register routes
  app.register(autoLoad, {
    dir: join(import.meta.dirname, 'v2'),
    routeParams: true,
    maxDepth: 2,
  });
};
