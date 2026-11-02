import type { PaginationParams } from '~/lib/prisma';

import type { DataHostID } from '~/models/datahost/dto';
import type { DiffEntry } from '~/models/diff/dto';

import { Model, createModelTransaction } from '../model';
import {
  type CreateSyncActivity,
  type CreateSyncHostAction,
  SyncActivity,
  type SyncActivityID,
  SyncActivityWithActions,
  SyncHostAction,
  type UpdateSyncActivity,
} from './dto';
import {
  addDiffToSyncHostAction,
  countAllSyncActivity,
  createSyncActivity,
  createSyncHostAction,
  deleteSyncActivity,
  doesSyncActivityExists,
  findAllSyncActivity,
  findOneSyncActivity,
  updateSyncActivity,
} from './methods';

export class SyncActivityModel extends Model {
  /**
   * Start a new transaction
   *
   * @param executor - If a function is provided : The executor of the transaction, take a service as parameter
   * @param option - Options to start transaction
   *
   * @returns The result of the transaction
   */
  static $transaction = createModelTransaction(this);

  // CREATE

  /**
   * Create sync activity
   *
   * @param input - The sync activity
   *
   * @returns The available release
   */
  async create(input: CreateSyncActivity): Promise<SyncActivity> {
    const activity = await createSyncActivity(input, this.db);

    return SyncActivity.parse(activity);
  }

  /**
   * Create sync action on host
   *
   * @param input - The sync activity
   *
   * @returns The available release
   */
  async createHostAction(input: CreateSyncHostAction): Promise<SyncHostAction> {
    const activity = await createSyncHostAction(input, this.db);

    return SyncHostAction.parse(activity);
  }

  // READ

  /**
   * Get all sync activities with pagination options
   *
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The hosts matching filters
   */
  async findAll(query: PaginationParams = {}): Promise<SyncActivity[]> {
    const hosts = await findAllSyncActivity(query, this.db);

    return hosts.map((host) => SyncActivity.parse(host));
  }

  /**
   * Count all sync activities available
   *
   * @param query - Filters to apply (if any)
   *
   * @returns The count of sync activities matching filters
   */
  async countAll(query: null): Promise<number> {
    const count = await countAllSyncActivity(query, this.db);

    return count;
  }

  /**
   * Check for the existence of a sync activity
   *
   * @param id - The id of the host
   *
   * @returns If the host exists
   */
  async doesExists(id: SyncActivityID): Promise<boolean> {
    const exists = await doesSyncActivityExists(id, this.db);

    return exists;
  }

  /**
   * Get one sync activity with actions
   *
   * @param id - The id of the host
   * @param includes - The relations to include
   *
   * @returns The host
   */
  async findOne(id: SyncActivityID): Promise<SyncActivityWithActions> {
    const activity = await findOneSyncActivity(id, this.db);

    return SyncActivityWithActions.parse(activity);
  }

  // UPDATE

  /**
   * Update sync activity
   *
   * @param input - The sync activity
   *
   * @returns The available release
   */
  async update(input: UpdateSyncActivity): Promise<SyncActivity> {
    const activity = await updateSyncActivity(input, this.db);

    return SyncActivity.parse(activity);
  }

  async addDiffToHostActive(input: {
    syncId: string;
    dataHostId: DataHostID;
    diff: DiffEntry[];
  }): Promise<SyncHostAction> {
    const activity = await addDiffToSyncHostAction(input, this.db);

    return SyncHostAction.parse(activity);
  }

  // DELETE

  /**
   * Delete registered sync activity
   *
   * @param id - The id of the host
   *
   * @returns If release supports was removed
   */
  async delete(id: SyncActivityID): Promise<boolean> {
    const isDeleted = await deleteSyncActivity(id, this.db);

    return isDeleted;
  }
}
