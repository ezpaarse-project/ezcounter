import { describe, expect, test } from 'vitest';

import type { HarvestJob } from '@ezcounter/database/types';
import type { HarvestJobData } from '@ezcounter/models/queues';

import { dbClient } from '~/lib/__mocks__/prisma';

import {
  createManyHarvestJob,
  failManyHarvestJob,
  findAllHarvestJob,
  findManyHarvestJobById,
  updateOneHarvestJob,
} from '~/models/harvest';

describe('CREATE Harvest Jobs', () => {
  describe('createManyHarvestJob', () => {
    test('should query DB', async () => {
      await createManyHarvestJob([]);

      expect(dbClient.harvestJob.createMany).toBeCalled();
    });

    test('should transform input', async () => {
      const item: HarvestJobData = {
        id: 'id',
        download: {
          cacheKey: 'download.cacheKey',
          report: {
            id: 'download.report.id',
            release: '5.1',
            period: {
              start: 'download.report.period.start',
              end: 'download.report.period.end',
            },
            params: {
              access_method: ['download.report.params.access_method.0'],
              foo: 'download.dataHost.additionalParams.foo',
            },
          },
          dataHost: {
            auth: {},
            baseUrl: 'download.dataHost.baseUrl',
            periodFormat: 'download.dataHost.periodFormat',
            paramsSeparator: 'download.dataHost.paramsSeparator',
          },
          forceDownload: true,
          timeout: 10,
        },
        insert: {
          index: 'insert.index',
        },
      };

      await createManyHarvestJob([item]);

      expect(dbClient.harvestJob.createMany).toBeCalledWith({
        data: [
          {
            id: 'id',
            reportId: 'download.report.id',
            period: {
              start: 'download.report.period.start',
              end: 'download.report.period.end',
            },
            release: '5.1',
            params: {
              access_method: ['download.report.params.access_method.0'],
            },
            dataHostId: 'download.cacheKey',
            forceDownload: true,
            index: 'insert.index',
            status: 'pending',
          },
        ],
      });
    });
  });
});

describe('READ Harvest Jobs', () => {
  describe('findAllHarvestJob', () => {
    test('should query DB', async () => {
      dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

      await findAllHarvestJob();

      expect(dbClient.harvestJob.findMany).toBeCalled();
    });

    test('should return array', async () => {
      dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

      const promise = findAllHarvestJob();

      await expect(promise).resolves.toBeInstanceOf(Array);
    });
  });

  describe('findManyHarvestJobById', () => {
    test('should query DB', async () => {
      dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

      await findManyHarvestJobById([]);

      expect(dbClient.harvestJob.findMany).toBeCalled();
    });

    test('should return array', async () => {
      dbClient.harvestJob.findMany.mockResolvedValueOnce([]);

      const promise = findManyHarvestJobById([]);

      await expect(promise).resolves.toBeInstanceOf(Array);
    });
  });
});

describe('UPDATE Harvest Jobs', () => {
  describe('updateOneHarvestJob', () => {
    // oxlint-disable-next-line consistent-function-scoping
    const getJob = (): HarvestJob => ({
      id: '',
      reportId: '',
      period: { start: '2025-01', end: '2025-12' },
      release: '5.1',
      params: {},
      dataHostId: '',
      timeout: 60000,
      forceDownload: false,
      index: '',
      status: 'pending',
      current: null,
      error: null,
      download: { done: false },
      extract: { done: false },
      createdAt: new Date(),
      updatedAt: null,
      startedAt: null,
      took: null,
    });

    test('should query DB', async () => {
      const job = getJob();

      dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
      dbClient.harvestJob.update.mockResolvedValueOnce(job);

      await updateOneHarvestJob({ id: '' });

      expect(dbClient.harvestJob.update).toBeCalled();
    });

    test('should return job', async () => {
      const job = getJob();

      dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
      dbClient.harvestJob.update.mockResolvedValueOnce(job);

      const promise = updateOneHarvestJob({ id: '' });

      await expect(promise).resolves.toMatchObject(job);
    });

    test('should throw if trying to update a done job', async () => {
      const job = getJob();
      job.status = 'done';

      dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);

      const promise = updateOneHarvestJob({ id: '' });

      await expect(promise).rejects.toThrow(
        'Unable to update a job with status: done'
      );
    });

    test('should throw if trying to update a error job', async () => {
      const job = getJob();
      job.status = 'error';

      dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);

      const promise = updateOneHarvestJob({ id: '' });

      await expect(promise).rejects.toThrow(
        'Unable to update a job with status: error'
      );
    });
  });

  describe('failManyHarvestJob', () => {
    test('should query DB', async () => {
      await failManyHarvestJob([
        {
          id: '',
          error: {
            code: 'app:ERROR',
            message: 'Creation error',
          },
        },
      ]);

      expect(dbClient.harvestJob.update).toBeCalled();
    });

    test('should use transaction', async () => {
      await failManyHarvestJob([
        {
          id: '',
          error: {
            code: 'app:ERROR',
            message: 'Creation error',
          },
        },
      ]);

      expect(dbClient.$transaction).toBeCalled();
    });
  });
});
