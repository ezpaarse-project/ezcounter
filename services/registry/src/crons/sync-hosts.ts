import { CronJob } from 'cron';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import { SyncModel } from '~/models/sync';

const { source: config } = appConfig;

const logger = appLogger.child({
  cron: 'sync-hosts',
  scope: 'cron',
});

export const syncHostsCron = CronJob.from({
  cronTime: config.syncSchedule,
  onTick: async () => {
    logger.debug({ msg: 'Starting sync' });

    const syncModel = new SyncModel();
    const result = await syncModel.syncHosts();

    if (!result) {
      logger.debug({
        err: 'Remote is not configured',
        msg: 'Unable to sync data hosts',
      });
      return;
    }
    if (result.status === 'error') {
      logger.warn({
        err: result.error?.message,
        msg: 'Unable to sync data hosts',
        sourceUrl: result.sourceUrl,
        took: result.took,
      });
      return;
    }

    logger.info({
      msg: 'Synced data hosts',
      sourceUrl: result.sourceUrl,
      took: result.took,
    });
  },
  start: false,
});
