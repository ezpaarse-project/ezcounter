import type { HarvestJobData } from '@ezcounter/dto/queues';

import type { PaginationParams } from '~/lib/prisma';

import { Model, createModelTransaction } from '../model';
import {
  type FailHarvestJob,
  type HarvestHooks,
  HarvestJob,
  type HarvestJobFilters,
  type UpdateHarvestJob,
} from './dto';
import { createManyHarvestJob } from './methods/create';
import {
  countAllHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
} from './methods/read';
import { failManyHarvestJob, updateOneHarvestJob } from './methods/update';
import { updateOneHarvestJobThrottled } from './methods/update-throttled';

export class HarvestJobModel extends Model {
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
   * Create many Harvest Jobs from data that will be passed in queues
   *
   * @param items - The harvest jobs to create
   * @param requestId - The request ID
   */
  async createMany(
    items: (HarvestJobData & { hooks?: HarvestHooks })[],
    requestId: string
  ): Promise<void> {
    await createManyHarvestJob(items, requestId, this.db);
  }

  // READ

  /**
   * Get all harvest jobs with pagination options
   *
   * @param query - Filters and pagination to apply (if any)
   *
   * @returns The harvest jobs matching filters
   */
  async findAll(
    query: PaginationParams & HarvestJobFilters = {}
  ): Promise<HarvestJob[]> {
    const jobs = await findAllHarvestJob(query, this.db);

    return jobs.map((job) => HarvestJob.parse(job));
  }

  /**
   * Count all harvest jobs available
   *
   * @param query - Filters to apply (if any)
   *
   * @returns The count of harvest jobs matching filters
   */
  async countAll(query: HarvestJobFilters = {}): Promise<number> {
    const count = await countAllHarvestJob(query, this.db);

    return count;
  }

  /**
   * Get many Harvest Jobs from ids
   *
   * @param ids - The ids of the jobs
   *
   * @returns The jobs
   */
  async findManyById(ids: string[]): Promise<HarvestJob[]> {
    const jobs = await findManyHarvestJobById(ids, this.db);

    return jobs.map((job) => HarvestJob.parse(job));
  }

  // UPDATE

  /**
   * Update one Harvest Job
   *
   * @param target - The data to update in harvest job
   *
   * @returns The full harvest job
   */
  async updateOne(target: UpdateHarvestJob): Promise<HarvestJob> {
    const job = await updateOneHarvestJob(target, this.db);

    return HarvestJob.parse(job);
  }

  /**
   * Update one Harvest Job but throttled to avoid concurrency issues
   *
   * @param data - The data to update in harvest job
   */
  updateOneThrottled(data: UpdateHarvestJob): void {
    updateOneHarvestJobThrottled(data, this.db);
  }

  /**
   * Mark many Harvest Jobs as failed with provided errors
   *
   * @param items - The harvest jobs IDs with error
   * @param tx - The DB client (can be a transaction)
   */
  async failMany(items: FailHarvestJob[]): Promise<void> {
    await failManyHarvestJob(items, this.db);
  }
}
