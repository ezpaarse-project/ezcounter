import { describe, expect, it, vi } from 'vitest';

import type { EnrichJobContent } from '@ezcounter/dto/queues';

import {
  type EnrichStatus,
  type Enricher,
  createEnrichPipeline,
} from './pipeline';

describe('enrich pipeline', () => {
  it('should calls nothing when enrichers are empty', async () => {
    expect.assertions(1);

    const result = await createEnrichPipeline([], {
      content: {} as EnrichJobContent,
      options: {},
    });

    expect(result).toBe(true);
  });

  it('should invokes the enrichers once following order', async () => {
    expect.assertions(5);

    type TestEnricher = Enricher<Record<string, unknown>, { step: number }>;

    // oxlint-disable-next-line unicorn/no-useless-undefined
    let result: number | undefined = undefined;
    let status: EnrichStatus = 'skipped';

    const enricher1 = vi.fn<TestEnricher>(async (job, next) => {
      // oxlint-disable-next-line node/callback-return
      await next({ step: 1 }, 'store');
      return true;
    });
    const enricher2 = vi.fn<TestEnricher>(async (job, next) => {
      // oxlint-disable-next-line node/callback-return vitest/no-conditional-in-test
      await next({ step: (job.result.data?.step ?? 0) + 1 }, 'remote');
      return true;
    });
    const enricher3 = vi.fn<TestEnricher>(async (job, next) => {
      // oxlint-disable-next-line node/callback-return
      await next(null, 'miss');
      return true;
    });
    const final = vi.fn<TestEnricher>((job) => {
      result = job.result.data?.step;
      // oxlint-disable-next-line prefer-destructuring
      status = job.result.status;
      return Promise.resolve(true);
    });

    await createEnrichPipeline([enricher1, enricher2, enricher3, final], {
      content: {} as EnrichJobContent,
      options: {},
    });

    expect(enricher1).toHaveBeenCalledOnce();
    expect(enricher2).toHaveBeenCalledOnce();
    expect(enricher1).toHaveBeenCalledBefore(enricher2);

    // Enricher1 should set result to 1, Enricher2 to 2, Enricher3 should return null and so not update
    expect(result).toBe(2);
    // One is remote so it overrides
    expect(status).toBe('remote');
  });
});
