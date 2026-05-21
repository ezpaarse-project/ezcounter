import { describe, expect, test, vi } from 'vitest';

import type { OpenAlexWork } from '../dto';
import { getWorkByDOI } from '.';
import { bufferedFetchOneWorkByDOI } from './__mocks__/works';
import { mockedStore } from './remotes/__mocks__';

vi.mock(import('./works'));
vi.mock(import('./remotes'));

describe('Get Document by DOI', () => {
  const spy = vi.fn();

  test('should try to get document from store', async () => {
    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.get).toHaveBeenCalledExactlyOnceWith(
      'work:doi:10.9999/xxxxxx1'
    );
  });

  test('should return stored document', async () => {
    mockedStore.get.mockResolvedValueOnce({
      authorships: [],
      ids: {
        doi: '10.9999/xxxxxx1',
        openalex: '',
      },
      open_access: {
        is_oa: true,
        oa_status: 'diamond',
      },
      // oxlint-disable-next-line typescript/no-explicit-any - have many overloads
    } satisfies OpenAlexWork as any);

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        ids: {
          doi: '10.9999/xxxxxx1',
          openalex: '',
        },
      }),
      'store'
    );
  });

  test('should ignore invalid stored document', async () => {
    mockedStore.get.mockResolvedValueOnce({
      foobar: true,
      // oxlint-disable-next-line typescript/no-explicit-any - have many overloads
    } as any);

    bufferedFetchOneWorkByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  test('should ignore store failures', async () => {
    mockedStore.get.mockRejectedValueOnce(new Error('Store error'));

    bufferedFetchOneWorkByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  test('should buffer fetch if store is unavailable', async () => {
    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(bufferedFetchOneWorkByDOI).toHaveBeenCalledOnce();
  });

  test('should store fetch results', async () => {
    bufferedFetchOneWorkByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched({
          authorships: [],
          ids: {
            doi: '10.9999/xxxxxx1',
            openalex: '',
          },
          open_access: {
            is_oa: true,
            oa_status: 'diamond',
          },
        });
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.set).toHaveBeenCalledExactlyOnceWith(
      'work:doi:10.9999/xxxxxx1',
      expect.objectContaining({
        ids: { doi: '10.9999/xxxxxx1', openalex: '' },
      })
    );
  });

  test('should NOT store fetch results if no results', async () => {
    bufferedFetchOneWorkByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.set).not.toHaveBeenCalled();
  });

  test('should NOT throw if store failure', async () => {
    mockedStore.set.mockRejectedValueOnce(new Error('Store error'));

    bufferedFetchOneWorkByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched({
          authorships: [],
          ids: {
            doi: '10.9999/xxxxxx1',
            openalex: '',
          },
          open_access: {
            is_oa: true,
            oa_status: 'diamond',
          },
        });
        return Promise.resolve(true);
      }
    );

    const promise = getWorkByDOI('10.9999/xxxxxx1', spy);

    await expect(promise).resolves.not.toThrow();
  });

  test('should resolves independent from onDocument', async () => {
    bufferedFetchOneWorkByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        setTimeout(() => {
          onFetched({
            authorships: [],
            ids: {
              doi: '10.9999/xxxxxx1',
              openalex: '',
            },
            open_access: {
              is_oa: true,
              oa_status: 'diamond',
            },
          });
        }, 50);

        return Promise.resolve(true);
      }
    );

    const resolveSpy = vi.fn();
    await getWorkByDOI('10.9999/xxxxxx1', spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
