import type { PaginationParams } from '~/lib/prisma';

import { Model, createModelTransaction } from '../model';
import {
  type CreateDataHost,
  type CreateDataHostSupportedRelease,
  type CreateDataHostSupportedReport,
  DataHost,
  type DataHostFilters,
  DataHostSupportedRelease,
  type DataHostSupportedReleaseFilters,
  type DataHostSupportedReleaseID,
  DataHostSupportedReport,
  type DataHostSupportedReportFilters,
  type DataHostSupportedReportID,
  DataHostWithSupportedData,
} from './dto';
import {
  upsertDataHost,
  upsertReleaseSupportedByDataHost,
  upsertReportSupportedByDataHost,
} from './methods/create';
import {
  deleteDataHost,
  deleteReleaseSupportedByDataHost,
  deleteReportSupportedByDataHost,
} from './methods/delete';
import {
  countAllDataHost,
  countAllReleasesSupportedByDataHost,
  countAllReportsSupportedByDataHost,
  doesDataHostExists,
  doesDataHostSupportsRelease,
  doesDataHostSupportsReport,
  findAllDataHost,
  findAllReleasesSupportedByDataHost,
  findAllReportsSupportedByDataHost,
  findOneDataHost,
  findOneDataHostWithSupportedData,
  findOneReleaseSupportedByDataHost,
  findOneReportSupportedByDataHost,
} from './methods/read';

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
   * Create or Update data host
   *
   * @param input - The data host
   *
   * @returns The supported release
   */
  async upsert(input: CreateDataHost): Promise<DataHost> {
    const dataHost = await upsertDataHost(input, this.db);

    return DataHost.parse(dataHost);
  }

  /**
   * Create or Update supported release of a data host
   *
   * @param input - The release with data host id
   *
   * @returns The supported release
   */
  async upsertReleaseSupported(
    input: CreateDataHostSupportedRelease
  ): Promise<DataHostSupportedRelease> {
    const release = await upsertReleaseSupportedByDataHost(input, this.db);

    return DataHostSupportedRelease.parse(release);
  }

  /**
   * Create or Update supported report of a data host
   *
   * @param input - The report with data host id
   *
   * @returns The supported report
   */
  async upsertReportSupported(
    input: CreateDataHostSupportedReport
  ): Promise<DataHostSupportedReport> {
    const report = await upsertReportSupportedByDataHost(input, this.db);

    return DataHostSupportedReport.parse(report);
  }

  // READ

  /**
   * Check for the existence of a data host
   *
   * @param id - The id of the host
   *
   * @returns If the host exists
   */
  async doesExists(id: string): Promise<boolean> {
    const exists = await doesDataHostExists(id, this.db);

    return exists;
  }

  /**
   * Get all data hosts with pagination options
   *
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The hosts matching filters
   */
  async findAll(
    query: PaginationParams & DataHostFilters = {}
  ): Promise<DataHost[]> {
    const dataHosts = await findAllDataHost(query, this.db);

    return dataHosts.map((dataHost) => DataHost.parse(dataHost));
  }

  /**
   * Count all data hosts available
   *
   * @param query - Filters to apply (if any)
   *
   * @returns The count of data hosts matching filters
   */
  async countAll(query: DataHostFilters = {}): Promise<number> {
    const count = await countAllDataHost(query, this.db);

    return count;
  }

  /**
   * Get one data host
   *
   * @param id - The id of the host
   *
   * @returns The host
   */
  async findOne(id: string): Promise<DataHost> {
    const dataHost = await findOneDataHost(id, this.db);

    return DataHost.parse(dataHost);
  }

  /**
   * Check for the support of a release for a data host
   *
   * @param id - The id of release
   *
   * @returns If the release is supported by data host
   */
  async doesSupportsRelease(id: DataHostSupportedReleaseID): Promise<boolean> {
    const exists = await doesDataHostSupportsRelease(id, this.db);

    return exists;
  }

  /**
   * Get all releases supported by data host
   *
   * @param dataHostId - The id of the host
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The supported releases
   */
  async findAllReleasesSupported(
    dataHostId: string,
    query: PaginationParams & DataHostSupportedReleaseFilters = {}
  ): Promise<DataHostSupportedRelease[]> {
    const releases = await findAllReleasesSupportedByDataHost(
      dataHostId,
      query,
      this.db
    );

    return releases.map((release) => DataHostSupportedRelease.parse(release));
  }

  /**
   * Count all release supported available
   *
   * @param dataHostId - The id of the host
   * @param query - Filters to apply (if any)
   *
   * @returns The count of release supported matching filters
   */
  async countAllReleasesSupported(
    dataHostId: string,
    query: DataHostSupportedReleaseFilters = {}
  ): Promise<number> {
    const count = await countAllReleasesSupportedByDataHost(
      dataHostId,
      query,
      this.db
    );

    return count;
  }

  /**
   * Get supported release by data host ID - assume that DataHost AND SupportedRelease exists
   *
   * @see `doesDataHostExists`
   * @see `doesDataHostSupportsRelease`
   *
   * @param id - The id of release
   *
   * @returns The supported release with data host if found
   */
  async findOneReleaseSupported(
    id: DataHostSupportedReleaseID
  ): Promise<DataHostSupportedRelease> {
    const release = await findOneReleaseSupportedByDataHost(id, this.db);

    return DataHostSupportedRelease.parse(release);
  }

  /**
   * Check for the support of a report for a data host
   *
   * @param id - The id of report
   *
   * @returns If the report is supported by data host
   */
  async doesSupportsReport(id: DataHostSupportedReportID): Promise<boolean> {
    const exists = await doesDataHostSupportsReport(id, this.db);

    return exists;
  }

  /**
   * Get all reports supported by data host
   *
   * @param releaseId - The id of release
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The supported reports
   */
  async findAllReportsSupported(
    releaseId: DataHostSupportedReleaseID,
    query: PaginationParams & DataHostSupportedReportFilters = {}
  ): Promise<DataHostSupportedReport[]> {
    const reports = await findAllReportsSupportedByDataHost(
      releaseId,
      query,
      this.db
    );

    return reports.map((report) => DataHostSupportedReport.parse(report));
  }

  /**
   * Count all release supported available
   *
   * @param releaseId - The id of the host
   * @param query - Filters to apply (if any)
   *
   * @returns The count of release supported matching filters
   */
  async countAllReportsSupported(
    releaseId: DataHostSupportedReleaseID,
    query: DataHostSupportedReportFilters = {}
  ): Promise<number> {
    const count = await countAllReportsSupportedByDataHost(
      releaseId,
      query,
      this.db
    );

    return count;
  }

  /**
   * Get one reports supported by data host
   *
   * @param id - The id of report
   *
   * @returns The supported report or null if not found
   */
  async findOneReportSupported(
    id: DataHostSupportedReportID
  ): Promise<DataHostSupportedReport> {
    const report = await findOneReportSupportedByDataHost(id, this.db);

    return DataHostSupportedReport.parse(report);
  }

  /**
   * Get one data host with it's supported data
   *
   * @param id - The id of the data host
   *
   * @returns The data host with supported data
   */
  async findOneWithSupportedData(
    id: string
  ): Promise<DataHostWithSupportedData> {
    const dataHost = await findOneDataHostWithSupportedData(id, this.db);

    return DataHostWithSupportedData.parse(dataHost);
  }

  // UPDATE

  // DELETE

  /**
   * Delete registered data host
   *
   * @param id - The id of the host
   *
   * @returns If release supports was removed
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await deleteDataHost(id, this.db);

    return deleted;
  }

  /**
   * Delete supported release of a data host - meaning release is NOT supported
   *
   * @param id - The id of the release
   *
   * @returns If release supports was removed
   */
  async deleteReleaseSupported(
    id: DataHostSupportedReleaseID
  ): Promise<boolean> {
    const deleted = await deleteReleaseSupportedByDataHost(id, this.db);

    return deleted;
  }

  /**
   * Delete supported release of a data host - meaning release is NOT supported
   *
   * @param id - The id of the report
   *
   * @returns If release supports was removed
   */
  async deleteReportSupported(id: DataHostSupportedReportID): Promise<boolean> {
    const deleted = await deleteReportSupportedByDataHost(id, this.db);

    return deleted;
  }
}
