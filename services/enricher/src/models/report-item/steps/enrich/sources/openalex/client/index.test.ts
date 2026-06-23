import { describe, expect, it, vi } from 'vitest';

import type { OpenAlexWork } from '../dto';
import { getWorkByDOI } from '.';
// oxlint-disable-next-line vitest/no-mocks-import - We need to get mockedStore as store is not exported
import { mockedStore } from './remotes/__mocks__';
import { bufferedFetchOneWorkByDOI } from './works';

vi.mock(import('./works'));
vi.mock(import('./remotes'));

describe('get Document by DOI', () => {
  const spy =
    vi.fn<
      (doc: OpenAlexWork | null, status: 'remote' | 'store') => Promise<void>
    >();

  it('should try to get document from store', async () => {
    expect.hasAssertions();
    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.get).toHaveBeenCalledExactlyOnceWith(
      'work:doi:10.9999/xxxxxx1'
    );
  });

  it('should return stored document', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore).get.mockResolvedValueOnce({
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

  it('should ignore invalid stored document', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore).get.mockResolvedValueOnce({
      foobar: true,
      // oxlint-disable-next-line typescript/no-explicit-any - have many overloads
    } as any);

    vi.mocked(bufferedFetchOneWorkByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  it('should ignore store failures', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore).get.mockRejectedValueOnce(new Error('Store error'));

    vi.mocked(bufferedFetchOneWorkByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  it('should buffer fetch if store is unavailable', async () => {
    expect.hasAssertions();
    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(bufferedFetchOneWorkByDOI).toHaveBeenCalledOnce();
  });

  it('should store fetch results', async () => {
    expect.hasAssertions();
    vi.mocked(bufferedFetchOneWorkByDOI).mockImplementationOnce(
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

  it('should NOT store fetch results if no results', async () => {
    expect.hasAssertions();
    vi.mocked(bufferedFetchOneWorkByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getWorkByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.set).not.toHaveBeenCalled();
  });

  it('should NOT throw if store failure', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore).set.mockRejectedValueOnce(new Error('Store error'));

    vi.mocked(bufferedFetchOneWorkByDOI).mockImplementationOnce(
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

  it('should resolves independent from onDocument', async () => {
    expect.hasAssertions();
    vi.mocked(bufferedFetchOneWorkByDOI).mockImplementationOnce(
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

    const resolveSpy = vi.fn<() => void>();
    await getWorkByDOI('10.9999/xxxxxx1', spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
