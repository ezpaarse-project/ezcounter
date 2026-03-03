import {
  createLogger,
  isPrettierInstalled,
  type Level,
  type LoggerOptions,
} from '@ezcounter/logger';

import { config } from '~/lib/config';

const { level, dir, ignore } = config.log;

const options: Omit<LoggerOptions, 'name'> = {
  pretty: isPrettierInstalled(import.meta.resolve),
  ignore: Array.isArray(ignore) ? ignore : [ignore],
  level: level as Level,
  dir,
};

export const appLogger = createLogger({ ...options, name: 'api' });
export const accessLogger = createLogger({ ...options, name: 'access' });
