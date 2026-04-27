import {
  type LoggerOptions,
  createLogger,
  isPrettierInstalled,
} from '@ezcounter/logger';

import { appConfig } from '~/lib/config';

const { log: config } = appConfig;

const options: Omit<LoggerOptions, 'name'> = {
  dir: config.dir,
  ignore: Array.isArray(config.ignore) ? config.ignore : [config.ignore],
  level: config.level,
  pretty: isPrettierInstalled((spec) => import.meta.resolve(spec)),
};

export const appLogger = createLogger({ ...options, name: 'api' });
export const accessLogger = createLogger({ ...options, name: 'access' });
