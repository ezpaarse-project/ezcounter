import type { ReportValidationResponse } from '@ezcounter/dto/rpc';
import type { MessageMeta, Reply } from '@ezcounter/rabbitmq';
import {
  ReportValidationOptions,
  type ReportValidationResult,
} from '@ezcounter/dto/validate';

import { appLogger } from '~/lib/logger';
import { createRPCServer } from '~/lib/rabbitmq';
import { receiveThroughTCP } from '~/lib/tcp/server';

import { validateReport } from '~/models/report/validate';

const QUEUE_NAME = 'ezcounter.rpc:reports.validate';

const logger = appLogger.child({ queue: QUEUE_NAME, scope: 'rpc' });

/**
 * Process Validation request
 *
 * @param data - The message content
 * @param meta - Message meta
 * @param reply - Reply to request
 */
export async function onValidationRequest(
  data: ReportValidationOptions,
  meta: MessageMeta,
  reply: Reply<ReportValidationResponse>
): Promise<void> {
  const expiration = meta.expiration
    ? Number.parseInt(meta.expiration, 10)
    : undefined;

  let validationPromise: Promise<ReportValidationResult | null> =
    Promise.resolve(null);

  const { addr, stream } = await receiveThroughTCP(() => validationPromise, {
    expiration,
  });
  // Starting validation as soon as data is available
  validationPromise = validateReport(stream, data);

  await reply({ host: addr.address, port: addr.port });
}

/**
 * Serve report validation method
 */
export function serveReportValidationJobs(): void {
  const server = createRPCServer({
    logger,
    onMessage: onValidationRequest,
    options: {
      queue: QUEUE_NAME,
      queueOptions: { durable: true },
    },
    schema: ReportValidationOptions,
  });

  server.on('ready', () => {
    logger.debug('Report validation server ready');
  });
}
