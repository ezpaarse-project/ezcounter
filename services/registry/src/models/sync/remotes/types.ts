import type { DataHostSync } from '~/models/sync/dto';

/**
 * Interface for implementing a remote for sync
 */
export type ISyncRemote = {
  readonly sourceURL: string;

  fetchHostSyncData: () => AsyncGenerator<DataHostSync>;
};
