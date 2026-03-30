import { describe, expect, test } from 'vitest';

import type { HarvestJob } from '@ezcounter/database';

import { dbClient } from '~/lib/__mocks__/prisma';

import { failManyHarvestJob, updateOneHarvestJob } from './update';

describe(updateOneHarvestJob, () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): HarvestJob => ({
    createdAt: new Date(),
    current: null,
    dataHostId: '',
    download: { done: false },
    error: null,
    extract: { done: false },
    forceDownload: false,
    id: '',
    index: '',
    params: {},
    period: { end: '2025-12', start: '2025-01' },
    release: '5.1',
    reportId: '',
    startedAt: null,
    status: 'pending',
    timeout: 60_000,
    took: null,
    updatedAt: null,
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
    let updatedData: unknown = null;
    // @ts-expect-error - Prisma types are more complex
    dbClient.harvestJob.update.mockImplementationOnce(({ data }) => {
      updatedData = data;
      return Promise.resolve(job);
    });

    await updateOneHarvestJob({
      download: { done: true },
      extract: { done: true },
      id: '',
    });

    expect(updatedData).toHaveProperty('status', 'done');
    expect(updatedData).toHaveProperty('took');
  });

  test('should update status and took if started and error occurred', async () => {
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    let updatedData: unknown = null;
    // @ts-expect-error - Prisma types are more complex
    dbClient.harvestJob.update.mockImplementationOnce(({ data }) => {
      updatedData = data;
      return Promise.resolve(job);
    });

    const error = {
      code: '',
      message: '',
    };

    await updateOneHarvestJob({
      error,
      id: '',
    });

    expect(updatedData).toHaveProperty('status', 'error');
    expect(updatedData).toHaveProperty('error', error);
    expect(updatedData).toHaveProperty('took');
  });

  test('should NOT update status if processing', async () => {
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    let updatedData: unknown = null;
    // @ts-expect-error - Prisma types are more complex
    dbClient.harvestJob.update.mockImplementationOnce(({ data }) => {
      updatedData = data;
      return Promise.resolve(job);
    });

    await updateOneHarvestJob({
      download: { done: true },
      extract: { done: false },
      id: '',
    });

    expect(updatedData).toHaveProperty('status', job.status);
    expect(updatedData).toHaveProperty('download.done', true);
    expect(updatedData).toHaveProperty('extract.done', false);
  });

  test('should NOT update status if not started', async () => {
    const job = getJob();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    let updatedData: unknown = null;
    // @ts-expect-error - Prisma types are more complex
    dbClient.harvestJob.update.mockImplementationOnce(({ data }) => {
      updatedData = data;
      return Promise.resolve(job);
    });

    await updateOneHarvestJob({
      download: { done: true },
      extract: { done: false },
      id: '',
    });

    expect(updatedData).toHaveProperty('status', job.status);
    expect(updatedData).toHaveProperty('download.done', true);
    expect(updatedData).toHaveProperty('extract.done', false);
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

describe(failManyHarvestJob, () => {
  test('should query DB', async () => {
    await failManyHarvestJob([
      {
        error: {
          code: 'app:ERROR',
          message: 'Creation error',
        },
        id: '',
      },
    ]);

    expect(dbClient.harvestJob.update).toBeCalled();
  });

  test('should use transaction', async () => {
    await failManyHarvestJob([
      {
        error: {
          code: 'app:ERROR',
          message: 'Creation error',
        },
        id: '',
      },
    ]);

    expect(dbClient.$transaction).toBeCalled();
  });
});
