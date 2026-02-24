import type { FastifyInstance } from 'fastify';
import { expect, test, beforeAll } from 'vitest';

import { z } from '@ezcounter/models/lib/zod';

import { createServer } from '~/lib/http';

import type { ErrorResponse } from '~/routes/v1/responses';
import { HTTPError } from '~/routes/v1/errors';
import { setupResponses } from '~/routes/v1';

let server: FastifyInstance;
beforeAll(async () => {
  // Setup server before any test - not using autoload cause it have issues with vitest
  server = await createServer(async (fastify) => {
    setupResponses(fastify);

    // Test routes
    fastify.route({
      method: 'POST',
      url: '/',
      schema: {
        body: z.object({
          foo: z.string(),
        }),
      },
      handler: async () => ({ foo: 'bar' }),
    });

    fastify.route({
      method: 'GET',
      url: '/invalid-response',
      schema: {
        response: {
          200: z.object({
            ping: z.string(),
          }),
        },
      },
      handler: async () => ({ pong: '' }),
    });

    fastify.route({
      method: 'GET',
      url: '/private',
      handler: async () => {
        throw new HTTPError(401, 'Need to auth');
      },
    });

    fastify.route({
      method: 'GET',
      url: '/not-implemented',
      handler: async () => {
        throw new Error('Not implemented');
      },
    });

    fastify.route({
      method: 'GET',
      url: '/literal-error',
      handler: async () => {
        // oxlint-disable-next-line no-throw-literal
        throw 'Not an error object';
      },
    });
  });
});

test("should return NOT_FOUND if route doesn't exists", async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/not-found',
  });

  const { error } = response.json<ErrorResponse>();

  expect(response).toHaveProperty('statusCode', 404);
  expect(error).toHaveProperty('message', 'Route not found');
});

test('should return BAD_REQUEST if request is invalid', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/',
  });

  const { error } = response.json<ErrorResponse>();

  expect(response).toHaveProperty('statusCode', 400);
  expect(error).toHaveProperty('message', "Request doesn't match the schema");
  expect(error).toHaveProperty(
    'cause.issues.0.message',
    'Invalid input: expected object, received null'
  );
});

test('should return INTERNAL_SERVER_ERROR if response is invalid', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/invalid-response',
  });

  const { error } = response.json<ErrorResponse>();

  expect(response).toHaveProperty('statusCode', 500);
  expect(error).toHaveProperty(
    'message',
    "Response doesn't match the schema. Please contact the administrators"
  );
  expect(error).toHaveProperty(
    'cause.issues.0.message',
    'Invalid input: expected string, received undefined'
  );
});

test('should return UNAUTHORIZED if error with UNAUTHORIZED is thrown', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/private',
  });

  const { error } = response.json<ErrorResponse>();

  expect(response).toHaveProperty('statusCode', 401);
  expect(error).toHaveProperty('message', 'Need to auth');
});

test('should return INTERNAL_SERVER_ERROR if error is thrown', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/not-implemented',
  });

  const { error } = response.json<ErrorResponse>();

  expect(response).toHaveProperty('statusCode', 500);
  expect(error).toHaveProperty('message', 'Not implemented');
});

test('should return INTERNAL_SERVER_ERROR if literal error is thrown', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/literal-error',
  });

  const { error } = response.json<ErrorResponse>();

  expect(response).toHaveProperty('statusCode', 500);
  expect(error).toHaveProperty('message', 'Not an error object');
});
