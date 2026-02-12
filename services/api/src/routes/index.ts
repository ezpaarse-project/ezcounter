import type { FastifyPluginAsync } from 'fastify';

import { v1 } from './v1';

export const router: FastifyPluginAsync = async (fastify) => {
  // Default version
  await fastify.register(v1);

  // API versions
  await fastify.register(v1, { prefix: '/v1' });
};
