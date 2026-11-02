import { resolve } from 'node:path';

import type { FastifyInstance } from 'fastify';
import vite from '@fastify/vite';

export async function initClient(fastify: FastifyInstance): Promise<void> {
  await fastify.register(vite, {
    // The reason why the file is at app's root, so this location points to the dev version and bundled
    root: resolve(import.meta.dirname, 'client'),
    spa: true,
  });

  // oxlint-disable-next-line require-await
  fastify.get('/', async (req, reply) => reply.html());

  await fastify.vite.ready();
}
