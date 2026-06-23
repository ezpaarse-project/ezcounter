import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent } from '@ezcounter/dto/queues';

import { enrichItemUsingEzUnpaywall } from '.';
import { getDOIOfItem } from '../../identifiers';
import { getDocumentByDOI } from './client';

vi.mock(import('../../identifiers'));
vi.mock(import('./client'));

describe('enrich with Unpaywall', () => {
  const spy = vi.fn<(...args: unknown[]) => Promise<void>>();

  it('should look for DOI in item', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = '5.1';

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(getDOIOfItem).toHaveBeenCalledExactlyOnceWith(data.item, '5.1');
  });

  it('should fallback to COUNTER 5', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = null;

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(getDOIOfItem).toHaveBeenCalledExactlyOnceWith(data.item, '5');
  });

  it('should mark item as skipped if no DOI is found', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'skipped');
  });

  it('should mark item as missed if remote sent no response', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    vi.mocked(getDocumentByDOI).mockImplementationOnce((_doi, next) => {
      next(null, 'remote');
      return Promise.resolve(true);
    });

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'miss');
  });

  it('should transform response to item', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    vi.mocked(getDocumentByDOI).mockImplementationOnce((_doi, next) => {
      next({ doi: '10.9999/xxxxxx1' }, 'store');
      return Promise.resolve(true);
    });

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      {
        X_EzUnpaywall: {
          doi: '10.9999/xxxxxx1',
          is_oa: undefined,
          journal_is_oa: undefined,
          journal_issn_l: undefined,
          journal_issns: undefined,
          oa_status: undefined,
          year: undefined,
        },
      },
      'store'
    );
  });

  it('should resolves independent from next step', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    // Delay next step
    vi.mocked(getDocumentByDOI).mockImplementationOnce((_doi, next) => {
      setTimeout(() => {
        next(null, 'remote');
      }, 50);
      return Promise.resolve(true);
    });

    const resolveSpy = vi.fn<() => void>();
    await enrichItemUsingEzUnpaywall(data, {}, spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
