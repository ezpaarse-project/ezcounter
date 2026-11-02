import type {
  FastifyInstance,
  FastifyPluginAsync,
  LightMyRequestResponse,
} from 'fastify';
import { beforeEach, vi } from 'vitest';

import { createServer } from '~/lib/http';

import type {
  ErrorResponse,
  SuccessResponse,
} from '~/routes/v1/shared/responses';
import { setupResponses } from '~/routes/v1';

/**
 * Wrapper around `createServer` to register Fastify server for tests
 *
 * @param routes - Routes to register
 *
 * @returns The HTTP server
 */
export function createTestServer(
  routes: FastifyPluginAsync
): Promise<FastifyInstance> {
  // Fastify injects needs real timers
  beforeEach(() => {
    vi.useRealTimers();
  });

  // oxlint-disable-next-line require-await
  return createServer(async (fastify) => {
    // Not using autoload cause it have issues with vitest
    setupResponses(fastify);

    fastify.register(routes);
  });
}

/**
 * Wrapper around LightMyRequest to extract response from (fake) HTTP request
 *
 * @param response - The response from LightMyRequest
 *
 * @throws {Error} If result have error
 *
 * @returns The successful result
 */
export function deserializeSuccessResponse<Content, Meta = undefined>(
  response: LightMyRequestResponse
): SuccessResponse<Content, Meta> {
  const result = response.json<
    SuccessResponse<Content, Meta> | ErrorResponse
  >();

  if ('error' in result) {
    throw new Error(`Server error: ${result.error.message}`, {
      cause: result.error,
    });
  }

  return result;
}
