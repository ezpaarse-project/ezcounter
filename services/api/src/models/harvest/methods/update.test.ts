import { describe, expect, it, vi } from 'vitest';

import type { HarvestJob } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { triggerHarvestHooks } from '../hooks';
import { failManyHarvestJob, updateOneHarvestJob } from './update';

vi.mock(import('../hooks'));

describe('update one harvest job', () => {
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
    hooks: {},
    id: '',
    index: '',
    insert: { status: 'processing' },
    params: {},
    period: { end: '2025-12', start: '2025-01' },
    release: '5.1',
    reportId: '',
    requestId: '',
    startedAt: null,
    status: 'pending',
    timeout: 60_000,
    took: null,
    updatedAt: null,
  });

  it('should query DB', async () => {
    expect.hasAssertions();
    const job = getJob();

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await updateOneHarvestJob({ id: 'foobar' }, dbClient);

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'foobar' },
      })
    );
  });

  it('should return job', async () => {
    expect.hasAssertions();
    const job = getJob();

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    const promise = updateOneHarvestJob({ id: '' }, dbClient);

    await expect(promise).resolves.toMatchObject(job);
  });

  it('should update status and took if completed', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await updateOneHarvestJob(
      {
        download: { status: 'done' },
        enrich: { status: 'done' },
        extract: { status: 'done' },
        id: '',
        insert: { status: 'done' },
      },
      dbClient
    );

    const expectedData = expect.objectContaining({
      status: 'done',
      took: expect.closeTo(0, 5),
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expectedData })
    );
  });

  it('should update status and took if started and error occurred', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    const error = {
      code: '',
      message: '',
    };

    await updateOneHarvestJob(
      {
        error,
        id: '',
      },
      dbClient
    );

    const expectedData = expect.objectContaining({
      error,
      status: 'error',
      took: expect.closeTo(0, 5),
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expectedData })
    );
  });

  it('should update enrich step', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.enrichSources = ['ezunpaywall', 'openalex'];
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

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await updateOneHarvestJob(
      {
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
      },
      dbClient
    );

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

  it('should update insert step', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.extract = { items: 10, status: 'done' };
    job.insert = {
      coveredMonths: ['2025-02'],
      created: 5,
      items: 7,
      status: 'processing',
      updated: 2,
    };

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await updateOneHarvestJob(
      {
        id: '',
        insert: {
          coveredMonths: ['2025-01', '2025-06'],
          created: 2,
          items: 3,
          status: 'processing',
          updated: 8,
        },
      },
      dbClient
    );

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

  it('should NOT update status if processing', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.status = 'processing';
    job.startedAt = new Date();

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await updateOneHarvestJob(
      {
        download: { status: 'done' },
        extract: { status: 'processing' },
        id: '',
      },
      dbClient
    );

    const expectedData = expect.objectContaining({
      download: expect.objectContaining({
        status: 'done',
      }),
      extract: expect.objectContaining({
        status: 'processing',
      }),
      status: job.status,
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expectedData })
    );
  });

  it('should NOT update status if not started', async () => {
    expect.hasAssertions();
    const job = getJob();

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await updateOneHarvestJob(
      {
        download: { status: 'done' },
        extract: { status: 'processing' },
        id: '',
      },
      dbClient
    );

    const expectedData = expect.objectContaining({
      download: expect.objectContaining({
        status: 'done',
      }),
      extract: expect.objectContaining({
        status: 'processing',
      }),
      status: job.status,
    });

    expect(dbClient.harvestJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expectedData })
    );
  });

  it('should throw if trying to update a done job', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.status = 'done';

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);

    const promise = updateOneHarvestJob({ id: '' }, dbClient);

    await expect(promise).rejects.toThrow(
      'Unable to update a job with status: done'
    );
  });

  it('should throw if trying to update a error job', async () => {
    expect.hasAssertions();
    const job = getJob();
    job.status = 'error';

    vi.mocked(dbClient.harvestJob.findUniqueOrThrow).mockResolvedValueOnce(job);

    const promise = updateOneHarvestJob({ id: '' }, dbClient);

    await expect(promise).rejects.toThrow(
      'Unable to update a job with status: error'
    );
  });
});

describe('fail many harvest jobs', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): HarvestJob => ({
    createdAt: new Date(),
    dataHostId: '',
    download: { status: 'pending' },
    enrich: { status: 'pending' },
    enrichSources: [],
    error: {
      code: 'app:ERROR',
      message: 'Creation error',
    },
    extract: { status: 'pending' },
    forceDownload: false,
    hooks: {},
    id: '',
    index: '',
    insert: { status: 'pending' },
    params: {},
    period: { end: '2025-12', start: '2025-01' },
    release: '5.1',
    reportId: '',
    requestId: '',
    startedAt: null,
    status: 'error',
    timeout: 60_000,
    took: null,
    updatedAt: null,
  });

  it('should query DB', async () => {
    expect.assertions(2);
    vi.mocked(dbClient.$transaction).mockImplementationOnce((ops) =>
      // @ts-expect-error - Prisma types are complex
      Promise.all(ops)
    );
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(getJob());

    await failManyHarvestJob(
      [
        {
          error: {
            code: 'app:ERROR',
            message: 'Creation error',
          },
          id: 'id',
        },
      ],
      dbClient
    );

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(dbClient.harvestJob.update).toHaveBeenCalledExactlyOnceWith({
      data: {
        error: expect.objectContaining({ message: 'Creation error' }),
        status: 'error',
      },
      where: { id: 'id' },
    });
  });

  it('should trigger hooks', async () => {
    expect.assertions(1);
    const job = getJob();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((ops) =>
      // @ts-expect-error - Prisma types are complex
      Promise.all(ops)
    );
    vi.mocked(dbClient.harvestJob.update).mockResolvedValueOnce(job);

    await failManyHarvestJob(
      [
        {
          error: {
            code: 'app:ERROR',
            message: 'Creation error',
          },
          id: 'id',
        },
      ],
      dbClient
    );

    expect(triggerHarvestHooks).toHaveBeenCalledExactlyOnceWith(job);
  });
});
