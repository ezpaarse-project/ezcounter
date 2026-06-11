import type { Readable } from 'node:stream';

import { ReportValidationResponse } from '@ezcounter/dto/rpc';
import {
  type ReportValidationOptions,
  ReportValidationResult,
} from '@ezcounter/dto/validate-report';

import { appLogger } from '~/lib/logger';
import { createRPCClient } from '~/lib/rabbitmq';
import { uploadThroughTCP } from '~/lib/tcp/client';

const QUEUE_NAME = 'ezcounter.rpc:reports.validate';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'rpc' });

const client = createRPCClient({
  options: {
    confirm: true,
    queues: [{ durable: true, queue: QUEUE_NAME }],
  },
});

/**
 * Validate COUNTER report using RPC and TCP
 *
 * @param stream - The report data, sent with TCP
 * @param options - The options to validate report, sent with RPC
 *
 * @returns The validation result, received with TCP
 */
// oxlint-disable-next-line max-lines-per-function
export async function validateCOUNTERReport(
  stream: Readable,
  options: ReportValidationOptions
): Promise<ReportValidationResult> {
  try {
    const message = await client.send({ routingKey: QUEUE_NAME }, options);
    const remote = ReportValidationResponse.parse(message.body);

    const response = await uploadThroughTCP(stream, remote, {
      allowHalfOpen: true,
    });

    const data = JSON.parse(response.toString('utf8'));
    return ReportValidationResult.parse(data);
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to validate report',
    });
    throw error;
  }
}
