import { merge } from 'es-toolkit';

import type { PaginationParams } from '~/lib/prisma';

import type { DataHostID } from '~/models/datahost/dto';
import { objectDiff } from '~/models/diff/methods';

import type {
  CreateDataHostRelease,
  DataHostRelease,
  DataHostReleaseID,
  UpdateDataHostRelease,
} from './dto';
import { Model, createModelTransaction } from '../model';
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
   * @returns The available release
   */
  async create(input: CreateDataHostRelease): Promise<DataHostRelease> {
    const dataHost = await createDataHostRelease(input, this.db);

    return applyDataHostReleaseChanges(dataHost);
  }

  /**
   * Create a local release for a data host
   *
   * This create an unavailable release then add a change to support it, allowing for future syncs to add support
   *
   * @param input - The release for a data host
   *
   * @returns The available release
   */
  async createLocal(input: CreateDataHostRelease): Promise<DataHostRelease> {
    const source = await this.create({
      ...input,
      supported: false,
    });

    if (input.supported === false) {
      return source;
    }

    const target = merge(source, { supported: true });

    await createDataHostReleaseChange(
      {
        dataHostId: input.dataHostId,
        diff: objectDiff(source, target),
        release: input.release,
      },
      this.db
    );

    return this.findOne({
      dataHostId: input.dataHostId,
      release: input.release,
    });
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
   * @returns The available release
   */
  async update(input: UpdateDataHostRelease): Promise<DataHostRelease> {
    const dataHost = await updateDataHostRelease(input, this.db);

    return applyDataHostReleaseChanges(dataHost);
  }

  /**
   * Update release for a data host by creating a local change
   *
   * @param input - The release for a data host
   *
   * @returns The available release
   */
  async updateLocal(input: UpdateDataHostRelease): Promise<DataHostRelease> {
    const source = await this.findOne(input);
    const target = merge(source, input);

    await createDataHostReleaseChange(
      {
        dataHostId: input.dataHostId,
        diff: objectDiff(source, target),
        release: input.release,
      },
      this.db
    );

    return this.findOne(input);
  }

  // DELETE

  /**
   * Delete registered release for a data host
   *
   * @param id - The id of the release
   *
   * @returns If release support was removed
   */
  async delete(id: DataHostReleaseID): Promise<boolean> {
    const isDeleted = await deleteDataHostRelease(id, this.db);

    return isDeleted;
  }
}
