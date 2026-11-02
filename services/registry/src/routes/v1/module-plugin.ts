import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

type ModuleHandler = (
  prefix: string,
  module: Promise<{ router: FastifyPluginAsync }>
) => Promise<void>;

/**
 * Fastify plugin to register modules as router
 *
 * @param fastify - The fastify instance
 * @param opts - The plugin options
 */
const plugin: FastifyPluginAsync = async (fastify) => {
  const registerModule: ModuleHandler = async (prefix, module) => {
    const { router } = await module;

    await fastify.register(router, { prefix });
  };

  fastify.decorate('registerModule', registerModule);
};

declare module 'fastify' {
  // oxlint-disable-next-line typescript/consistent-type-definitions - Module augmentation
  interface FastifyInstance {
    registerModule: ModuleHandler;
  }
}

// Register plugin
export const modulePlugin = fp(plugin, {
  name: 'ezc-v1-module',
});
