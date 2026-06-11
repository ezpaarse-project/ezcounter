import { appLogger } from '~/lib/logger';

import { serveCredentialsCheckJobs } from './data-host/auth/check';
import { serveReportValidationJobs } from './report/validate';

const logger = appLogger.child({ scope: 'rpc' });

/**
 * Init all RPC that service will provide
 */
export function initRPCServers(): void {
  const start = process.uptime();

  serveReportValidationJobs();
  serveCredentialsCheckJobs();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
