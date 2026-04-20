import { setupConfig } from '@ezcounter/config';
import { logLevels } from '@ezcounter/logger';

import type defaultConfig from '~/../config/default.json';

export const appConfig = setupConfig<typeof defaultConfig>({
  watch: {
    logger: {
      levels: logLevels.values,
      log: (message: string): boolean => process.stdout.write(`${message}\n`),
      meta: { name: 'api', scope: 'config' },
    },
  },
});
