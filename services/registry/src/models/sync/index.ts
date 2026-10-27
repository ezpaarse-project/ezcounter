import { z } from '@ezcounter/dto';

import type { SyncActivity, SyncError } from '~/models/sync-activity/dto';
import { SyncActivityModel } from '~/models/sync-activity';

import type { ISyncRemote } from './remotes/types';
import { syncHosts } from './methods/hosts';
import { createSyncRemote } from './remotes';

export class SyncModel {
  /**
   * The remote to sync data from
   *
   * `null` if not available
   */
  protected remote: Promise<ISyncRemote | null>;

  /**
   * Create a new model to sync data
   */
  constructor() {
    this.remote = createSyncRemote();
  }

  /**
   * Execute host sync
   *
   * @returns The activity of the sync or null if nothing was done
   */
  async syncHosts(): Promise<SyncActivity | null> {
    const handler = await this.remote;
    if (!handler) {
      return null;
    }

    const startedAt = new Date();
    let syncError: SyncError | null = null;

    const activityModel = new SyncActivityModel();
    const sync = await activityModel.create({
      sourceUrl: handler.sourceURL,
      startedAt,
      status: 'processing',
    });

    try {
      await syncHosts(handler, sync.id);
    } catch (error) {
      let err = new Error('Something wrong happened', { cause: error });
      if (error instanceof Error) {
        err = error;
      }

      syncError = {
        cause: z.json().validate(err.cause) ? err.cause : undefined,
        code: err.name,
        message: err.message,
      };
    }

    return activityModel.update({
      error: syncError,
      id: sync.id,
      status: syncError ? 'error' : 'done',
      took: Date.now() - startedAt.getTime(),
    });
  }
}
