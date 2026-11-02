import { merge } from 'es-toolkit';

import type { PaginationParams } from '~/lib/prisma';

import { objectDiff } from '~/models/diff/methods';

import type {
  CreateDataHost,
  DataHost,
  DataHostID,
  UpdateDataHost,
} from './dto';
import { Model, createModelTransaction } from '../model';
import {
  applyDataHostChanges,
  countAllDataHost,
  createDataHost,
  createDataHostChange,
  deleteDataHost,
  doesDataHostExists,
  findAllDataHost,
  findOneDataHost,
  updateDataHost,
} from './methods';

export class DataHostModel extends Model {
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
   * Create a data host
   *
   * @param input - The data host
   *
   * @returns The available release
   */
  async create(input: CreateDataHost): Promise<DataHost> {
    const dataHost = await createDataHost(input, this.db);

    return applyDataHostChanges(dataHost);
  }

  /**
   * Create a local data host
   *
   * @param input - The data host
   *
   * @returns The available release
   */
  createLocal(input: Omit<CreateDataHost, 'local'>): Promise<DataHost> {
    return this.create({
      ...input,
      local: true,
    });
  }

  // READ

  /**
   * Get all data hosts with pagination options
   *
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The hosts matching filters
   */
  async findAll(query: PaginationParams = {}): Promise<DataHost[]> {
    const hosts = await findAllDataHost(query, this.db);

    return hosts.map((host) => applyDataHostChanges(host));
  }

  /**
   * Count all data hosts available
   *
   * @param query - Filters to apply (if any)
   *
   * @returns The count of data hosts matching filters
   */
  async countAll(query: null): Promise<number> {
    const count = await countAllDataHost(query, this.db);

    return count;
  }

  /**
   * Check for the existence of a data host
   *
   * @param id - The id of the host
   *
   * @returns If the host exists
   */
  async doesExists(id: DataHostID): Promise<boolean> {
    const exists = await doesDataHostExists(id, this.db);

    return exists;
  }

  /**
   * Get one data host
   *
   * @param id - The id of the host
   * @param includes - The relations to include
   *
   * @returns The host
   */
  async findOne(id: DataHostID): Promise<DataHost> {
    const dataHost = await findOneDataHost(id, this.db);

    return applyDataHostChanges(dataHost);
  }

  // UPDATE

  /**
   * Update data host by creating a change
   *
   * @param input - The data host
   *
   * @returns The available release
   */
  async update(input: UpdateDataHost): Promise<DataHost> {
    const dataHost = await updateDataHost(input, this.db);

    return applyDataHostChanges(dataHost);
  }

  /**
   * Update data host by creating a local change
   *
   * @param input - The data host
   *
   * @returns The available release
   */
  async updateLocal(input: Omit<UpdateDataHost, 'local'>): Promise<DataHost> {
    const source = await this.findOne(input.id);
    const target = merge(source, input);

    await createDataHostChange(
      {
        dataHostId: input.id,
        diff: objectDiff(source, target),
      },
      this.db
    );

    return this.findOne(input.id);
  }

  // DELETE

  /**
   * Delete registered data host
   *
   * @param id - The id of the host
   *
   * @returns If release supports was removed
   */
  async delete(id: DataHostID): Promise<boolean> {
    const isDeleted = await deleteDataHost(id, this.db);

    return isDeleted;
  }
}
