import { describe, expect, it, vi } from 'vitest';

import type { EzUnpaywallDocument } from '../dto';
import { getDocumentByDOI } from '.';
import { bufferedFetchOneDocumentByDOI } from './documents';
// oxlint-disable-next-line vitest/no-mocks-import - We need to get mockedStore as store is not exported
import { mockedStore } from './remotes/__mocks__';

vi.mock(import('./documents'));
vi.mock(import('./remotes'));

describe('get Document by DOI', () => {
  const spy = vi.fn<(...args: unknown[]) => Promise<void>>();

  it('should try to get document from store', async () => {
    expect.hasAssertions();
    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.get).toHaveBeenCalledExactlyOnceWith(
      'document:doi:10.9999/xxxxxx1'
    );
  });

  it('should return stored document', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore.get).mockResolvedValueOnce({
      doi: '10.9999/xxxxxx1',
      // oxlint-disable-next-line typescript/no-explicit-any - have many overloads
    } satisfies EzUnpaywallDocument as any);

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      {
        doi: '10.9999/xxxxxx1',
      },
      'store'
    );
  });

  it('should ignore invalid stored document', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore.get).mockResolvedValueOnce({
      foobar: true,
      // oxlint-disable-next-line typescript/no-explicit-any - have many overloads
    } as any);

    vi.mocked(bufferedFetchOneDocumentByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  it('should ignore store failures', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore.get).mockRejectedValueOnce(new Error('Store error'));

    vi.mocked(bufferedFetchOneDocumentByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  it('should buffer fetch if store is unavailable', async () => {
    expect.hasAssertions();
    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(bufferedFetchOneDocumentByDOI).toHaveBeenCalledOnce();
  });

  it('should store fetch results', async () => {
    expect.hasAssertions();
    vi.mocked(bufferedFetchOneDocumentByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched({ doi: '10.9999/xxxxxx1' });
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.set).toHaveBeenCalledExactlyOnceWith(
      'document:doi:10.9999/xxxxxx1',
      { doi: '10.9999/xxxxxx1' }
    );
  });

  it('should NOT store fetch results if no results', async () => {
    expect.hasAssertions();
    vi.mocked(bufferedFetchOneDocumentByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.set).not.toHaveBeenCalled();
  });

  it('should NOT throw if store failure', async () => {
    expect.hasAssertions();
    vi.mocked(mockedStore.set).mockRejectedValueOnce(new Error('Store error'));

    vi.mocked(bufferedFetchOneDocumentByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched({ doi: '10.9999/xxxxxx1' });
        return Promise.resolve(true);
      }
    );

    const promise = getDocumentByDOI('10.9999/xxxxxx1', spy);

    await expect(promise).resolves.not.toThrow();
  });

  it('should resolves independent from onDocument', async () => {
    expect.hasAssertions();
    vi.mocked(bufferedFetchOneDocumentByDOI).mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        setTimeout(() => {
          onFetched({ doi: '10.9999/xxxxxx1' });
        }, 50);

        return Promise.resolve(true);
      }
    );

    const resolveSpy = vi.fn<() => void>();
    await getDocumentByDOI('10.9999/xxxxxx1', spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
