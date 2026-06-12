import {
  type DataHostAuthCheckOptions,
  DataHostAuthCheckResult,
} from '@ezcounter/dto/data-host';

import { appLogger } from '~/lib/logger';
import { createRPCClient } from '~/lib/rabbitmq';

const QUEUE_NAME = 'ezcounter.rpc:data-host.auth.check';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'rpc' });

const client = createRPCClient({
  options: {
    confirm: true,
    queues: [{ durable: true, queue: QUEUE_NAME }],
  },
});

/**
 * VCheck auth to data host
 *
 * @param options - The options to check auth
 *
 * @returns The check result
 */
export async function checkDataHostAuth(
  options: DataHostAuthCheckOptions
): Promise<DataHostAuthCheckResult> {
  try {
    const message = await client.send({ routingKey: QUEUE_NAME }, options);
    return DataHostAuthCheckResult.parse(message.body);
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to check data host auth',
    });
    throw error;
  }
}
