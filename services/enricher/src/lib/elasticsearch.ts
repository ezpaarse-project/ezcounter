import { Client, type estypes as elastic } from '@elastic/elasticsearch';

import type { Heartbeat } from '@ezcounter/heartbeats/dto';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { elasticsearch: config } = appConfig;
const logger = appLogger.child(
  { scope: 'elastic' },
  {
    redact: {
      censor: (value) => value && ''.padStart(`${value}`.length, '*'),
      paths: ['config.*.password'],
    },
  }
);

/**
 * Test connection to cluster
 *
 * @param client - The ES client
 */
async function testConnection(client: Client): Promise<void> {
  try {
    await client.ping();
    logger.info({ config, msg: 'Connected to ElasticSearch' });
  } catch (error) {
    logger.error({ err: error, msg: 'Unable to connect to ElasticSearch' });
  }
}

/**
 * Setup ElasticSearch connection
 *
 * @returns ElasticSearch client
 */
function setupElasticSearch(): Client {
  const client = new Client({
    auth: config.apiKey
      ? { apiKey: config.apiKey }
      : { password: config.password, username: config.username },
    node: {
      url: new URL(config.url),
    },
    ssl: {
      rejectUnauthorized: config.tls.rejectUnauthorized,
    },
  });

  void testConnection(client);

  const onShutdown = async (): Promise<void> => {
    await client.close();
  };

  process.on('SIGINT', onShutdown);
  process.on('SIGTERM', onShutdown);

  return client;
}

/**
 * The ElasticSearch client
 */
const esClient = setupElasticSearch();

export type { elastic };

/**
 * Execute a dummy query to check if the ES connection is working
 *
 * @returns If the connection is working
 */
export async function esPing(): Promise<
  Omit<Heartbeat, 'nextAt' | 'updatedAt'>
> {
  const { body } = await esClient.cluster.stats<elastic.ClusterStatsResponse>();

  return {
    filesystems: [
      {
        available: body.nodes.fs.available_in_bytes,
        name: 'elastic',
        total: body.nodes.fs.total_in_bytes,
        used: body.nodes.fs.total_in_bytes - body.nodes.fs.available_in_bytes,
      },
    ],
    hostname: body.cluster_name,
    service: 'elastic',
    version: body.nodes.versions.at(0),
  };
}

export type BulkIndexOperation = {
  action: elastic.BulkIndexOperation;
  document: Record<string, unknown>;
};

export type BulkIndexResult = {
  errors: Error[];
  created: number;
  updated: number;
};

/**
 * Shorthand to index multiple documents
 *
 * @param operations - The operations to execute
 *
 * @returns The result of the bulk operation
 */
export async function esBulkIndex(
  operations: BulkIndexOperation[]
): Promise<BulkIndexResult> {
  const { body } = await esClient.bulk<elastic.BulkResponse>({
    body: operations.flatMap(({ action: index, document }) => [
      { index },
      document,
    ]),
  });

  const stats: BulkIndexResult = {
    created: 0,
    errors: [],
    updated: 0,
  };

  for (const { index } of body.items) {
    const { result, error } = index ?? {};
    if (!result) {
      // oxlint-disable-next-line no-continue
      continue;
    }

    switch (result) {
      case 'created':
        stats.created += 1;
        break;
      case 'updated':
        stats.updated += 1;
        break;

      default:
        break;
    }

    if (error) {
      const err = new Error(error.reason);
      err.name = error.type;
      stats.errors.push(err);
    }
  }

  return stats;
}
