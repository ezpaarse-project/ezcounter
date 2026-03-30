import {
  type LoggerOptions,
  createLogger,
  isPrettierInstalled,
} from '@ezcounter/logger';

import { config } from '~/lib/config';

const { level, dir, ignore } = config.log;

const options: Omit<LoggerOptions, 'name'> = {
  dir,
  ignore: Array.isArray(ignore) ? ignore : [ignore],
  level,
  pretty: isPrettierInstalled((spec) => import.meta.resolve(spec)),
};

export const appLogger = createLogger({ ...options, name: 'api' });
export const accessLogger = createLogger({ ...options, name: 'access' });
