import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent } from '@ezcounter/dto/queues';

import { enrichItemUsingEzUnpaywall } from '.';
import { getDOIOfItem } from '../../identifiers';
import { getDocumentByDOI } from './client';

vi.mock(import('../../identifiers'));
vi.mock(import('./client'));

describe('Enrich with Unpaywall', () => {
  const spy = vi.fn();

  test('should look for DOI in item', async () => {
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = '5.1';

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(getDOIOfItem).toHaveBeenCalledExactlyOnceWith(data.item, '5.1');
  });

  test('should fallback to COUNTER 5', async () => {
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = null;

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(getDOIOfItem).toHaveBeenCalledExactlyOnceWith(data.item, '5');
  });

  test('should mark item as skipped if no DOI is found', async () => {
    const data = mockDeep<EnrichJobContent>();

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'skipped');
  });

  test('should mark item as missed if remote sent no response', async () => {
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    vi.mocked(getDocumentByDOI).mockImplementationOnce((_doi, next) => {
      next(null, 'remote');
      return Promise.resolve(true);
    });

    await enrichItemUsingEzUnpaywall(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'miss');
  });

  test('should transform response to item', async () => {
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

  test('should resolves independent from next step', async () => {
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    // Delay next step
    vi.mocked(getDocumentByDOI).mockImplementationOnce((_doi, next) => {
      setTimeout(() => {
        next(null, 'remote');
      }, 50);
      return Promise.resolve(true);
    });

    const resolveSpy = vi.fn();
    await enrichItemUsingEzUnpaywall(data, {}, spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
