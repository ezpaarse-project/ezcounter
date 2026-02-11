import { setupConfig } from '@ezcounter/config';

import { logLevels } from '@ezcounter/logger';

import type defaultConfig from '../../config/default.json';

export const config = setupConfig<typeof defaultConfig>({
  watch: {
    logger: {
      log: (message: string): boolean => process.stdout.write(`${message}\n`),
      levels: logLevels.values,
      meta: { scope: 'config', name: 'api' },
    },
  },
});
