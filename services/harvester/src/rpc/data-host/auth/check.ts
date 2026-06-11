import type { MessageMeta, Reply } from '@ezcounter/rabbitmq';
import {
  DataHostAuthCheckOptions,
  type DataHostAuthCheckResult,
} from '@ezcounter/dto/data-host';

import { appLogger } from '~/lib/logger';
import { createRPCServer } from '~/lib/rabbitmq';

import { checkCredentials } from '~/models/data-host/auth/check';
import { IdleTimeoutController } from '~/models/idle-timeout';

const QUEUE_NAME = 'ezcounter.rpc:data-host.auth.check';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'rpc' });

/**
 * Process Credentials Check request
 *
 * @param data - The message content
 * @param meta - Message meta
 * @param reply - Reply to request
 */
export async function onCredentialsCheckRequest(
  data: DataHostAuthCheckOptions,
  meta: MessageMeta,
  reply: Reply<DataHostAuthCheckResult>
): Promise<void> {
  try {
    let timeout: IdleTimeoutController | undefined = undefined;
    if (meta.expiration) {
      const expiration = Number.parseInt(meta.expiration, 10);
      timeout = new IdleTimeoutController(expiration);
    }

    const result = await checkCredentials(data, timeout);

    await reply(result);
    timeout?.clear();
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to check credentials',
    });
    throw error;
  }
}

/**
 * Serve credentials check method
 */
export function serveCredentialsCheckJobs(): void {
  const server = createRPCServer({
    logger,
    onMessage: onCredentialsCheckRequest,
    options: {
      queue: QUEUE_NAME,
      queueOptions: { durable: true },
    },
    schema: DataHostAuthCheckOptions,
  });

  server.on('ready', () => {
    logger.debug('Credentials check server ready');
  });
}
