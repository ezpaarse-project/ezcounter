import { describe, expect, test } from 'vitest';

import { Prisma, type HarvestJob } from '@ezcounter/database';

import { dbClient } from '~/lib/__mocks__/prisma';

import { failManyHarvestJob, updateOneHarvestJob } from './update';

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

  test('should update status and took if completed', async () => {
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      id: '',
      download: { done: true },
      extract: { done: true },
    });

    expect(dbClient.harvestJob.update).toBeCalledWith({
      where: { id: '' },
      data: {
        ...job,
        download: { done: true },
        extract: { done: true },
        error: Prisma.DbNull,
        status: 'done',
        took: Date.now() - job.startedAt?.getTime(),
      },
    });
  });

  test('should update status and took if started and error occurred', async () => {
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    const error = {
      code: '',
      message: '',
    };

    await updateOneHarvestJob({
      id: '',
      error,
    });

    expect(dbClient.harvestJob.update).toBeCalledWith({
      where: { id: '' },
      data: {
        ...job,
        status: 'error',
        error,
        took: Date.now() - job.startedAt?.getTime(),
      },
    });
  });

  test('should NOT update status if processing', async () => {
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      id: '',
      download: { done: true },
      extract: { done: false },
    });

    expect(dbClient.harvestJob.update).toBeCalledWith({
      where: { id: '' },
      data: {
        ...job,
        download: { done: true },
        extract: { done: false },
        error: Prisma.DbNull,
      },
    });
  });

  test('should NOT update status if not started', async () => {
    const job = getJob();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      id: '',
      download: { done: true },
      extract: { done: false },
    });

    expect(dbClient.harvestJob.update).toBeCalledWith({
      where: { id: '' },
      data: {
        ...job,
        download: { done: true },
        extract: { done: false },
        error: Prisma.DbNull,
      },
    });
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
