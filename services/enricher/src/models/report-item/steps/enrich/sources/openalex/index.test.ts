import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent } from '@ezcounter/dto/queues';

import { enrichItemUsingOpenAlex } from '.';
import { getDOIOfItem } from '../../identifiers';
import { getWorkByDOI } from './client';

vi.mock(import('../../identifiers'));
vi.mock(import('./client'));

describe('enrich with OpenAlex', () => {
  const spy = vi.fn<(...args: unknown[]) => Promise<void>>();

  it('should look for DOI in item', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = '5.1';

    await enrichItemUsingOpenAlex(data, {}, spy);

    expect(getDOIOfItem).toHaveBeenCalledExactlyOnceWith(data.item, '5.1');
  });

  it('should fallback to COUNTER 5', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = null;

    await enrichItemUsingOpenAlex(data, {}, spy);

    expect(getDOIOfItem).toHaveBeenCalledExactlyOnceWith(data.item, '5');
  });

  it('should mark item as skipped if no DOI is found', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    await enrichItemUsingOpenAlex(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'skipped');
  });

  it('should mark item as missed if remote sent no response', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    vi.mocked(getWorkByDOI).mockImplementationOnce((_doi, next) => {
      next(null, 'remote');
      return Promise.resolve(true);
    });

    await enrichItemUsingOpenAlex(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'miss');
  });

  it('should transform response to item', async () => {
    expect.hasAssertions();
    const data = mockDeep<EnrichJobContent>();

    vi.mocked(getDOIOfItem).mockReturnValueOnce('10.9999/xxxxxx1');
    vi.mocked(getWorkByDOI).mockImplementationOnce((_doi, next) => {
      next(
        {
          authorships: [
            {
              author_position: 'first',
              institutions: [
                {
                  country_code: 'fr',
                },
              ],
            },
          ],
          ids: {
            doi: 'https://doi.org/10.9999/xxxxxx1',
            openalex: 'https://openalex.org/xxxx',
          },
          open_access: { is_oa: true, oa_status: 'gold' as const },
        },
        'store'
      );
      return Promise.resolve(true);
    });

    await enrichItemUsingOpenAlex(data, {}, spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      {
        X_OpenAlex: {
          countries: ['fr'],
          domain: undefined,
          ids: {
            doi: 'https://doi.org/10.9999/xxxxxx1',
            mag: null,
            openalex: 'https://openalex.org/xxxx',
            pmcid: null,
            pmid: null,
          },
          is_oa: true,
          language: undefined,
          oa_status: 'gold',
          publication_year: undefined,
          title: undefined,
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
    vi.mocked(getWorkByDOI).mockImplementationOnce((_doi, next) => {
      setTimeout(() => {
        next?.(null, 'remote');
      }, 50);
      return Promise.resolve(true);
    });

    const resolveSpy = vi.fn<() => void>();
    await enrichItemUsingOpenAlex(data, {}, spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
