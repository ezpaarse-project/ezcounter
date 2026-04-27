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
    enrich: { done: false },
    error: null,
    extract: { done: false },
    forceDownload: false,
    id: '',
    index: '',
    insert: { done: false },
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

    await updateOneHarvestJob({ id: 'foobar' });

    expect(dbClient.harvestJob.update).toBeCalledWith(
      expect.objectContaining({
        where: { id: 'foobar' },
      })
    );
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
      download: { done: true },
      enrich: { done: true },
      extract: { done: true },
      id: '',
      insert: { done: true },
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'done',
          took: expect.closeTo(0, 5),
        }),
      })
    );
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
      error,
      id: '',
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          error,
          status: 'error',
          took: expect.closeTo(0, 5),
        }),
      })
    );
  });

  test('should NOT update status if processing', async () => {
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      download: { done: true },
      extract: { done: false },
      id: '',
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          download: expect.objectContaining({
            done: true,
          }),
          extract: expect.objectContaining({
            done: false,
          }),
          status: job.status,
        }),
      })
    );
  });

  test('should NOT update status if not started', async () => {
    const job = getJob();

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      download: { done: true },
      extract: { done: false },
      id: '',
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          download: expect.objectContaining({
            done: true,
          }),
          extract: expect.objectContaining({
            done: false,
          }),
          status: job.status,
        }),
      })
    );
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
