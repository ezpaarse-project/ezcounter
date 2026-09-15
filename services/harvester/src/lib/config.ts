import { levels } from 'pino';

import { setupConfig } from '@ezcounter/config';

import type defaultConfig from '~/../config/default.json';

export const appConfig = setupConfig<typeof defaultConfig>({
  watch: {
    logger: {
      levels: levels.values,
      log: (message: string): boolean => process.stdout.write(`${message}\n`),
      meta: { name: 'api', scope: 'config' },
    },
  },
});
