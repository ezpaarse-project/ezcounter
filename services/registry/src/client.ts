// import { resolve } from 'node:path';
//
// import type { FastifyPluginAsync } from 'fastify';
// import middie from '@fastify/middie';
// import serveStatic from '@fastify/static';
// import fp from 'fastify-plugin';
// import { createServer as createViteServer } from 'vite';
//
// /**
//  * Setup routes to serve frontend
//  *
//  * Will start Vite Dev server in dev mode, and serve static files in production
//  *
//  * @param fastify - The fastify instance
//  *
//  * @returns Promise resolving when frontend is ready
//  */
// const frontendBasePlugin: FastifyPluginAsync = async (
//   fastify
// ): Promise<void> => {
//   if (process.argv.includes('--dev')) {
//     const devServer = await createViteServer({
//       configFile: resolve(import.meta.dirname, '../../client.vite.config.ts'),
//       server: { middlewareMode: true },
//     });
//
//     await fastify.register(middie);
//     fastify.use(devServer.middlewares);
//     return;
//   }
//
//   await fastify.register(serveStatic, {
//     decorateReply: false,
//     prefix: '/',
//     root: resolve(import.meta.dirname, 'client'),
//   });
// };
//
// export const frontendPlugin = fp(frontendBasePlugin, {
//   encapsulate: false,
//   name: 'ezc-frontend',
// });

import { resolve } from 'node:path';

import type { FastifyInstance } from 'fastify';
import vite from '@fastify/vite';

export async function initClient(fastify: FastifyInstance): Promise<void> {
  await fastify.register(vite, {
    // The reason why the file is at app's root, so this location points to the dev version and bundled
    root: resolve(import.meta.dirname, 'client'),
  });

  // oxlint-disable-next-line require-await
  fastify.get('/', async (req, reply) => reply.html());

  await fastify.vite.ready();
}
