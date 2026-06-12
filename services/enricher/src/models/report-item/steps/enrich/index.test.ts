import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent, EnrichJobData } from '@ezcounter/dto/queues';

import { queueEnrichJob } from '~/queues/enrich/jobs/pub';
import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { enrichReportItem } from '.';
import { enrichItemUsingEzUnpaywall, enrichItemUsingOpenAlex } from './sources';

vi.mock(import('~/queues/enrich/jobs/pub'));
vi.mock(import('~/queues/enrich/status'));
vi.mock(import('./sources'));

describe('Enrich report item (enrichReportItem)', () => {
  const job: EnrichJobData = {
    data: mockDeep<EnrichJobContent>(),
    enrich: {
      results: { X_Previous: true },
    },
    id: 'job-id',
    insert: {
      index: 'z-index',
    },
  };

  test('should mark job as processing', async () => {
    await enrichReportItem('ezunpaywall', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenCalledExactlyOnceWith({
      id: 'job-id',
      status: 'processing',
    });
  });

  test('should queue next step', async () => {
    vi.mocked(enrichItemUsingOpenAlex).mockImplementationOnce(
      (_data, _opts, next) => {
        // oxlint-disable-next-line typescript/no-explicit-any
        next({ X_Current: true } as any, 'remote');
        return Promise.resolve(true);
      }
    );

    await enrichReportItem('openalex', job);

    expect(queueEnrichJob).toHaveBeenCalledExactlyOnceWith({
      ...job,
      enrich: {
        results: {
          X_Current: true,
          X_Previous: true,
        },
      },
      id: 'job-id',
    });
  });

  test('should allow enrich using unpaywall', async () => {
    await enrichReportItem('ezunpaywall', job);

    expect(enrichItemUsingEzUnpaywall).toHaveBeenCalledOnce();
  });

  test('should allow enrich using openalex', async () => {
    await enrichReportItem('openalex', job);

    expect(enrichItemUsingOpenAlex).toHaveBeenCalledOnce();
  });

  test('should resolves independent from next step', async () => {
    // Delay next step
    vi.mocked(enrichItemUsingEzUnpaywall).mockImplementationOnce(
      (_data, _opts, next) => {
        setTimeout(() => {
          next(null, 'miss');
        }, 50);
        return Promise.resolve(true);
      }
    );

    const resolveSpy = vi.fn();
    await enrichReportItem('ezunpaywall', job).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(vi.mocked(queueEnrichJob));
  });

  test('should notify status', async () => {
    vi.mocked(enrichItemUsingEzUnpaywall).mockImplementationOnce(
      (_data, _opts, next) => {
        // oxlint-disable-next-line typescript/no-explicit-any
        next({} as any, 'remote');
        return Promise.resolve(true);
      }
    );

    await enrichReportItem('ezunpaywall', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enrich: {
          sources: {
            ezunpaywall: {
              items: 1,
              miss: 0,
              remote: 1,
              store: 0,
            },
          },
          status: 'processing',
        },
        id: 'job-id',
      })
    );
  });

  test('should notify status if enrich is from store', async () => {
    vi.mocked(enrichItemUsingEzUnpaywall).mockImplementationOnce(
      (_data, _opts, next) => {
        // oxlint-disable-next-line typescript/no-explicit-any
        next({} as any, 'store');
        return Promise.resolve(true);
      }
    );

    await enrichReportItem('ezunpaywall', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enrich: {
          sources: {
            ezunpaywall: {
              items: 1,
              miss: 0,
              remote: 0,
              store: 1,
            },
          },
          status: 'processing',
        },
        id: 'job-id',
      })
    );
  });

  test('should notify if enrich fails', async () => {
    vi.mocked(enrichItemUsingOpenAlex).mockImplementationOnce(
      (_data, _opts, next) => {
        next(null, 'miss');
        return Promise.resolve(true);
      }
    );

    await enrichReportItem('openalex', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enrich: {
          sources: {
            openalex: {
              items: 1,
              miss: 1,
              remote: 0,
              store: 0,
            },
          },
          status: 'processing',
        },
        id: 'job-id',
      })
    );
  });

  test('should notify if enrich cannot be done (no suitable identifiers)', async () => {
    vi.mocked(enrichItemUsingOpenAlex).mockImplementationOnce(
      (_data, _opts, next) => {
        next(null, 'skipped');
        return Promise.resolve(true);
      }
    );

    await enrichReportItem('openalex', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enrich: {
          sources: {
            openalex: {
              items: 1,
              miss: 0,
              remote: 0,
              store: 0,
            },
          },
          status: 'processing',
        },
        id: 'job-id',
      })
    );
  });

  test('should notify if error occurs', async () => {
    vi.mocked(enrichItemUsingOpenAlex).mockRejectedValueOnce(
      new Error('Enrich error')
    );

    await enrichReportItem('openalex', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith({
      error: expect.objectContaining({
        message: 'Enrich error',
      }),
      id: 'job-id',
      status: 'error',
    });
  });

  test('should notify if source is unknown', async () => {
    await enrichReportItem('foobar' as 'ezunpaywall', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith({
      error: expect.objectContaining({
        message: 'Enrich source foobar is not implemented',
      }),
      id: 'job-id',
      status: 'error',
    });
  });
});
