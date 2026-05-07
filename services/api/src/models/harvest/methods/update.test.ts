import { describe, expect, test } from 'vitest';

import type { HarvestJob } from '@ezcounter/database';

import { dbClient } from '~/lib/__mocks__/prisma';

import { failManyHarvestJob, updateOneHarvestJob } from './update';

describe(updateOneHarvestJob, () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): HarvestJob => ({
    createdAt: new Date(),
    dataHostId: '',
    download: { status: 'processing' },
    enrich: { status: 'processing' },
    enrichSources: [],
    error: null,
    extract: { status: 'processing' },
    forceDownload: false,
    id: '',
    index: '',
    insert: { status: 'processing' },
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
      download: { status: 'done' },
      enrich: { status: 'done' },
      extract: { status: 'done' },
      id: '',
      insert: { status: 'done' },
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

  test.only('should update enrich step', async () => {
    const job = getJob();
    job.extract = { items: 10, status: 'done' };
    job.enrich = {
      sources: {
        ezunpaywall: {
          items: 5,
          miss: 9,
          remote: 12,
          store: 4,
        },
      },
      status: 'processing',
    };

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      enrich: {
        sources: {
          ezunpaywall: {
            items: 5,
            miss: 1,
            remote: 5,
            store: 3,
          },
          openalex: {
            items: 10,
            miss: 0,
            remote: 3,
            store: 0,
          },
        },
        status: 'processing',
      },
      id: '',
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enrich: {
            progress: 1,
            sources: {
              ezunpaywall: {
                items: 10,
                miss: 10,
                progress: 1,
                remote: 17,
                store: 7,
              },
              openalex: {
                items: 10,
                miss: 0,
                progress: 1,
                remote: 3,
                store: 0,
              },
            },
            status: 'done',
          },
        }),
      })
    );
  });

  test('should update insert step', async () => {
    const job = getJob();
    job.extract = { items: 10, status: 'done' };
    job.insert = {
      coveredMonths: ['2025-02'],
      created: 5,
      items: 7,
      status: 'processing',
      updated: 2,
    };

    dbClient.harvestJob.findUniqueOrThrow.mockResolvedValueOnce(job);
    dbClient.harvestJob.update.mockResolvedValueOnce(job);

    await updateOneHarvestJob({
      id: '',
      insert: {
        coveredMonths: ['2025-01', '2025-06'],
        created: 2,
        items: 3,
        status: 'processing',
        updated: 8,
      },
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          insert: {
            coveredMonths: ['2025-01', '2025-02', '2025-06'],
            created: 7,
            items: 10,
            progress: 1,
            status: 'done',
            updated: 10,
          },
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
      download: { status: 'done' },
      extract: { status: 'processing' },
      id: '',
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          download: expect.objectContaining({
            status: 'done',
          }),
          extract: expect.objectContaining({
            status: 'processing',
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
      download: { status: 'done' },
      extract: { status: 'processing' },
      id: '',
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          download: expect.objectContaining({
            status: 'done',
          }),
          extract: expect.objectContaining({
            status: 'processing',
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
