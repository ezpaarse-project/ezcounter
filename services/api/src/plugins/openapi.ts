import type { FastifyPluginAsync } from 'fastify';
import fastifySwagger, {
  type FastifyDynamicSwaggerOptions,
} from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

import { version } from '../../package.json';

/*
 * Common API schemas
 */
export const schemas = {
  security: {},
};

type PluginOptions = {
  transform?: FastifyDynamicSwaggerOptions['transform'];
  transformObject?: FastifyDynamicSwaggerOptions['transformObject'];
};

const OPENAPI_INFOS = {
  title: 'ezCOUNTER API',
  version,
  contact: {
    name: 'ezTEAM',
    url: 'https://github.com/ezpaarse-project',
    email: 'ezpaarse@couperin.org',
  },
  license: {
    name: 'CeCILL',
    url: 'https://github.com/ezpaarse-project/ezcounter/blob/master/LICENSE.txt',
  },
  description: 'COUNTER harvesting service',
};

/**
 * Fastify plugin to setup openapi
 *
 * @param fastify The fastify instance
 */
const openapiBasePlugin: FastifyPluginAsync<PluginOptions> = async (
  fastify,
  opts
) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: OPENAPI_INFOS,
      servers: [{ url: '/', description: 'Direct' }],
    },
    transformObject: opts.transformObject,
    transform: opts.transform,
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/doc',
  });
};

// Register plugin
export const openapiPlugin = fp(openapiBasePlugin, {
  name: 'ezc-openapi',
  encapsulate: false,
});
