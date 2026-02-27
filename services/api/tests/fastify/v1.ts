import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

import { createServer } from '~/lib/http';

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
  // oxlint-disable-next-line require-await
  return createServer(async (fastify) => {
    // Not using autoload cause it have issues with vitest
    setupResponses(fastify);

    fastify.register(routes);
  });
}
