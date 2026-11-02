import type { FastifyInstance } from 'fastify';

/**
 * Shorthand to register all routes from modules
 *
 * @param fastify - Fastify instance
 */
export async function registerModules(fastify: FastifyInstance): Promise<void> {
  await Promise.all([
    fastify.registerModule('/', import('./root')),
    fastify.registerModule('/datahosts', import('./datahosts')),
  ]);
}
