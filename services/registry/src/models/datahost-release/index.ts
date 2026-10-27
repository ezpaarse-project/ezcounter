import type { PaginationParams } from '~/lib/prisma';

import type { DataHostID } from '~/models/datahost/dto';

import { Model, createModelTransaction } from '../model';
import {
  type CreateDataHostRelease,
  type CreateDataHostReleaseChange,
  type DataHostRelease,
  DataHostReleaseChange,
  type DataHostReleaseID,
  type UpdateDataHostRelease,
} from './dto';
import {
  applyDataHostReleaseChanges,
  countAllDataHostRelease,
  createDataHostRelease,
  createDataHostReleaseChange,
  deleteDataHostRelease,
  doesDataHostReleaseExists,
  findAllDataHostRelease,
  findOneDataHostRelease,
  updateDataHostRelease,
} from './methods';

export class DataHostReleaseModel extends Model {
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
   * Create release for a data host
   *
   * @param input - The release for a data host
   *
   * @returns The supported release
   */
  async create(input: CreateDataHostRelease): Promise<DataHostRelease> {
    const dataHost = await createDataHostRelease(input, this.db);

    return applyDataHostReleaseChanges(dataHost);
  }

  /**
   * Create change on release
   *
   * @param input - The change
   *
   * @returns The change
   */
  async createChange(
    input: CreateDataHostReleaseChange
  ): Promise<DataHostReleaseChange> {
    const change = await createDataHostReleaseChange(input, this.db);

    return DataHostReleaseChange.parse(change);
  }

  // READ

  /**
   * Get all releases for a data host with pagination options
   *
   * @param dataHostId - The id of the host
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The releases matching filters
   */
  async findAll(
    dataHostId: DataHostID,
    query: PaginationParams = {}
  ): Promise<DataHostRelease[]> {
    const releases = await findAllDataHostRelease(dataHostId, query, this.db);

    return releases.map((rel) => applyDataHostReleaseChanges(rel));
  }

  /**
   * Count all releases for a data host available
   *
   * @param dataHostId - The id of the host
   * @param query - Filters to apply (if any)
   *
   * @returns The count of releases matching filters
   */
  async countAll(dataHostId: DataHostID, query: null): Promise<number> {
    const count = await countAllDataHostRelease(dataHostId, query, this.db);

    return count;
  }

  /**
   * Check for the existence of a release for a data host
   *
   * @param id - The id of the release
   *
   * @returns If the release exists
   */
  async doesExists(id: DataHostReleaseID): Promise<boolean> {
    const exists = await doesDataHostReleaseExists(id, this.db);

    return exists;
  }

  /**
   * Get one release for a data host
   *
   * @param id - The id of the release
   * @param includes - The relations to include
   *
   * @returns The release
   */
  async findOne(id: DataHostReleaseID): Promise<DataHostRelease> {
    const dataHost = await findOneDataHostRelease(id, this.db);

    return applyDataHostReleaseChanges(dataHost);
  }

  // UPDATE

  /**
   * Update release for a data host
   *
   * @param input - The release for a data host
   *
   * @returns The supported release
   */
  async update(input: UpdateDataHostRelease): Promise<DataHostRelease> {
    const dataHost = await updateDataHostRelease(input, this.db);

    return applyDataHostReleaseChanges(dataHost);
  }

  // DELETE

  /**
   * Delete registered release for a data host
   *
   * @param id - The id of the release
   *
   * @returns If release supports was removed
   */
  async delete(id: DataHostReleaseID): Promise<boolean> {
    const isDeleted = await deleteDataHostRelease(id, this.db);

    return isDeleted;
  }
}
