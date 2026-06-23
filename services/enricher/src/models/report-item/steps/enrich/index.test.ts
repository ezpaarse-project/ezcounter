import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent, EnrichJobData } from '@ezcounter/dto/queues';

import { queueEnrichJob } from '~/queues/enrich/jobs/pub';
import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { enrichReportItem } from '.';
import { enrichItemUsingEzUnpaywall, enrichItemUsingOpenAlex } from './sources';

vi.mock(import('~/queues/enrich/jobs/pub'));
vi.mock(import('~/queues/enrich/status'));
vi.mock(import('./sources'));

describe('enrich report item', () => {
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

  it('should mark job as processing', async () => {
    expect.hasAssertions();
    await enrichReportItem('ezunpaywall', job);

    expect(sendEnrichJobStatusEvent).toHaveBeenCalledExactlyOnceWith({
      id: 'job-id',
      status: 'processing',
    });
  });

  it('should queue next step', async () => {
    expect.hasAssertions();
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

  it('should allow enrich using unpaywall', async () => {
    expect.hasAssertions();
    await enrichReportItem('ezunpaywall', job);

    expect(enrichItemUsingEzUnpaywall).toHaveBeenCalledOnce();
  });

  it('should allow enrich using openalex', async () => {
    expect.hasAssertions();
    await enrichReportItem('openalex', job);

    expect(enrichItemUsingOpenAlex).toHaveBeenCalledOnce();
  });

  it('should resolves independent from next step', async () => {
    expect.hasAssertions();
    // Delay next step
    vi.mocked(enrichItemUsingEzUnpaywall).mockImplementationOnce(
      (_data, _opts, next) => {
        setTimeout(() => {
          next(null, 'miss');
        }, 50);
        return Promise.resolve(true);
      }
    );

    const resolveSpy = vi.fn<() => void>();
    await enrichReportItem('ezunpaywall', job).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(vi.mocked(queueEnrichJob));
  });

  it('should notify status', async () => {
    expect.hasAssertions();
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

  it('should notify status if enrich is from store', async () => {
    expect.hasAssertions();
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

  it('should notify if enrich fails', async () => {
    expect.hasAssertions();
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

  it('should notify if enrich cannot be done (no suitable identifiers)', async () => {
    expect.hasAssertions();
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

  it('should notify if error occurs', async () => {
    expect.hasAssertions();
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

  it('should notify if source is unknown', async () => {
    expect.hasAssertions();
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
