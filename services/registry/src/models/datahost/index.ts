import type { PaginationParams } from '~/lib/prisma';

import { Model, createModelTransaction } from '../model';
import {
  type CreateDataHost,
  type CreateDataHostChange,
  type DataHost,
  DataHostChange,
  type DataHostID,
  type UpdateDataHost,
} from './dto';
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
   * Create data host
   *
   * @param input - The data host
   *
   * @returns The supported release
   */
  async create(input: CreateDataHost): Promise<DataHost> {
    const dataHost = await createDataHost(input, this.db);

    return applyDataHostChanges(dataHost);
  }

  /**
   * Create change on data host
   *
   * @param input - The change
   *
   * @returns The change
   */
  async createChange(input: CreateDataHostChange): Promise<DataHostChange> {
    const change = await createDataHostChange(input, this.db);

    return DataHostChange.parse(change);
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
   * Update data host
   *
   * @param input - The data host
   *
   * @returns The supported release
   */
  async update(input: UpdateDataHost): Promise<DataHost> {
    const dataHost = await updateDataHost(input, this.db);

    return applyDataHostChanges(dataHost);
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
