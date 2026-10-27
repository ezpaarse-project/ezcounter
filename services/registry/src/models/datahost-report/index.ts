import type { PaginationParams } from '~/lib/prisma';

import type { DataHostReleaseID } from '~/models/datahost-release/dto';

import { Model, createModelTransaction } from '../model';
import {
  type CreateDataHostReport,
  type CreateDataHostReportChange,
  type DataHostReport,
  DataHostReportChange,
  type DataHostReportID,
  type UpdateDataHostReport,
} from './dto';
import {
  applyDataHostReportChanges,
  countAllDataHostReport,
  createDataHostReport,
  createDataHostReportChange,
  deleteDataHostReport,
  doesDataHostReportExists,
  findAllDataHostReport,
  findOneDataHostReport,
  updateDataHostReport,
} from './methods';

export class DataHostReportModel extends Model {
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
  async create(input: CreateDataHostReport): Promise<DataHostReport> {
    const dataHost = await createDataHostReport(input, this.db);

    return applyDataHostReportChanges(dataHost);
  }

  /**
   * Create change on release
   *
   * @param input - The change
   *
   * @returns The change
   */
  async createChange(
    input: CreateDataHostReportChange
  ): Promise<DataHostReportChange> {
    const change = await createDataHostReportChange(input, this.db);

    return DataHostReportChange.parse(change);
  }

  // READ

  /**
   * Get all data hosts with pagination options
   *
   * @param releaseId - The id of the host
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The hosts matching filters
   */
  async findAll(
    releaseId: DataHostReleaseID,
    query: PaginationParams = {}
  ): Promise<DataHostReport[]> {
    const hosts = await findAllDataHostReport(releaseId, query, this.db);

    return hosts.map((host) => applyDataHostReportChanges(host));
  }

  /**
   * Count all data hosts available
   *
   * @param releaseId - The id of the host
   * @param query - Filters to apply (if any)
   *
   * @returns The count of data hosts matching filters
   */
  async countAll(releaseId: DataHostReleaseID, query: null): Promise<number> {
    const count = await countAllDataHostReport(releaseId, query, this.db);

    return count;
  }

  /**
   * Check for the existence of a data host
   *
   * @param id - The id of the host
   *
   * @returns If the host exists
   */
  async doesExists(id: DataHostReportID): Promise<boolean> {
    const exists = await doesDataHostReportExists(id, this.db);

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
  async findOne(id: DataHostReportID): Promise<DataHostReport> {
    const dataHost = await findOneDataHostReport(id, this.db);

    return applyDataHostReportChanges(dataHost);
  }

  // UPDATE

  /**
   * Update data host
   *
   * @param input - The data host
   *
   * @returns The supported release
   */
  async update(input: UpdateDataHostReport): Promise<DataHostReport> {
    const dataHost = await updateDataHostReport(input, this.db);

    return applyDataHostReportChanges(dataHost);
  }

  // DELETE

  /**
   * Delete registered data host
   *
   * @param id - The id of the host
   *
   * @returns If release supports was removed
   */
  async delete(id: DataHostReportID): Promise<boolean> {
    const isDeleted = await deleteDataHostReport(id, this.db);

    return isDeleted;
  }
}
