import type { FastifyPluginAsync } from 'fastify';
import swagget, { type FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

// oxlint-disable-next-line import/extensions
import { version } from '../../package.json' with { type: 'json' };

type PluginOptions = {
  transform?: FastifyDynamicSwaggerOptions['transform'];
  transformObject?: FastifyDynamicSwaggerOptions['transformObject'];
};

const OPENAPI_INFOS = {
  contact: {
    email: 'ezpaarse@couperin.org',
    name: 'ezTEAM',
    url: 'https://github.com/ezpaarse-project',
  },
  description: 'COUNTER harvesting service',
  license: {
    name: 'CeCILL',
    url: 'https://github.com/ezpaarse-project/ezcounter/blob/master/LICENSE.txt',
  },
  title: 'ezCOUNTER API',
  version,
};

const OPENAPI_TAGS = [
  { description: 'Health management', name: 'health' },
  { description: 'Harvest management', name: 'harvest' },
  { description: 'Data host management', name: 'data-host' },
];

/**
 * Fastify plugin to setup openapi
 *
 * @param fastify - The fastify instance
 * @param opts - The plugin options
 */
const openapiBasePlugin: FastifyPluginAsync<PluginOptions> = async (
  fastify,
  opts
) => {
  await fastify.register(swagget, {
    openapi: {
      info: OPENAPI_INFOS,
      servers: [{ description: 'Direct', url: '/' }],
      tags: OPENAPI_TAGS,
    },
    transform: opts.transform,
    transformObject: opts.transformObject,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/doc',
    staticCSP: true,
  });
};

// Register plugin
export const openapiPlugin = fp(openapiBasePlugin, {
  encapsulate: false,
  name: 'ezc-openapi',
});

/*
 * Common API schemas
 */
export const schemas = {
  security: {},
};
