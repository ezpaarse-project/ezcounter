import { merge } from 'es-toolkit';

import type { PaginationParams } from '~/lib/prisma';

import type { DataHostReleaseID } from '~/models/datahost-release/dto';
import { objectDiff } from '~/models/diff/methods';

import type {
  CreateDataHostReport,
  DataHostReport,
  DataHostReportID,
  UpdateDataHostReport,
} from './dto';
import { Model, createModelTransaction } from '../model';
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
   * Create report for a data host
   *
   * @param input - The report for a data host
   *
   * @returns The available release
   */
  async create(input: CreateDataHostReport): Promise<DataHostReport> {
    const dataHost = await createDataHostReport(input, this.db);

    return applyDataHostReportChanges(dataHost);
  }

  /**
   * Create a local report for a data host
   *
   * This create an unsupported report then add a change to support it, allowing for future syncs to add support
   * This is not needed for local data hosts
   *
   * @param input - The report for a data host
   *
   * @returns The available release
   */
  async createLocal(input: CreateDataHostReport): Promise<DataHostReport> {
    const source = await this.create({
      ...input,
      supported: false,
    });

    if (input.supported === false) {
      return source;
    }

    const target = merge(source, { supported: true });

    await createDataHostReportChange(
      {
        dataHostId: input.dataHostId,
        diff: objectDiff(source, target),
        release: input.release,
        reportId: input.reportId,
      },
      this.db
    );

    return this.findOne({
      dataHostId: input.dataHostId,
      release: input.release,
      reportId: input.reportId,
    });
  }

  // READ

  /**
   * Get all reports for a data host given a release with pagination options
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
   * Count all reports available for a data host given a release
   *
   * @param releaseId - The id of the host
   * @param query - Filters to apply (if any)
   *
   * @returns The count of reports matching filters
   */
  async countAll(releaseId: DataHostReleaseID, query: null): Promise<number> {
    const count = await countAllDataHostReport(releaseId, query, this.db);

    return count;
  }

  /**
   * Check for the existence of a report for a data host given a release
   *
   * @param id - The id of the report
   *
   * @returns If the report exists
   */
  async doesExists(id: DataHostReportID): Promise<boolean> {
    const exists = await doesDataHostReportExists(id, this.db);

    return exists;
  }

  /**
   * Get one a report for a data host given a release
   *
   * @param id - The id of the report
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
   * Update a report for a data host given a release
   *
   * @param input - The report
   *
   * @returns The supported report
   */
  async update(input: UpdateDataHostReport): Promise<DataHostReport> {
    const dataHost = await updateDataHostReport(input, this.db);

    return applyDataHostReportChanges(dataHost);
  }

  /**
   * Update report for a data host by creating a local change
   *
   * This is not needed for local data host
   *
   * @param input - The report for a data host
   *
   * @returns The supported report
   */
  async updateLocal(input: UpdateDataHostReport): Promise<DataHostReport> {
    const source = await this.findOne(input);
    const target = merge(source, input);

    await createDataHostReportChange(
      {
        dataHostId: input.dataHostId,
        diff: objectDiff(source, target),
        release: input.release,
        reportId: input.reportId,
      },
      this.db
    );

    return this.findOne(input);
  }

  // DELETE

  /**
   * Delete registered report for a data host given a release
   *
   * @param id - The id of the report
   *
   * @returns If report support was removed
   */
  async delete(id: DataHostReportID): Promise<boolean> {
    const isDeleted = await deleteDataHostReport(id, this.db);

    return isDeleted;
  }
}
