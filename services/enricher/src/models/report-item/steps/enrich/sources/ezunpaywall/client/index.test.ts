import { describe, expect, test, vi } from 'vitest';

import type { EzUnpaywallDocument } from '../dto';
import { getDocumentByDOI } from '.';
import { bufferedFetchOneDocumentByDOI } from './__mocks__/documents';
import { mockedStore } from './remotes/__mocks__';

vi.mock(import('./documents'));
vi.mock(import('./remotes'));

describe('Get Document by DOI', () => {
  const spy = vi.fn();

  test('should try to get document from store', async () => {
    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.get).toHaveBeenCalledExactlyOnceWith(
      'document:doi:10.9999/xxxxxx1'
    );
  });

  test('should return stored document', async () => {
    mockedStore.get.mockResolvedValueOnce({
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

  test('should ignore invalid stored document', async () => {
    mockedStore.get.mockResolvedValueOnce({
      foobar: true,
      // oxlint-disable-next-line typescript/no-explicit-any - have many overloads
    } as any);

    bufferedFetchOneDocumentByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  test('should ignore store failures', async () => {
    mockedStore.get.mockRejectedValueOnce(new Error('Store error'));

    bufferedFetchOneDocumentByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(spy).toHaveBeenCalledExactlyOnceWith(null, 'remote');
  });

  test('should buffer fetch if store is unavailable', async () => {
    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(bufferedFetchOneDocumentByDOI).toHaveBeenCalledOnce();
  });

  test('should store fetch results', async () => {
    bufferedFetchOneDocumentByDOI.mockImplementationOnce(
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

  test('should NOT store fetch results if no results', async () => {
    bufferedFetchOneDocumentByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched(null);
        return Promise.resolve(true);
      }
    );

    await getDocumentByDOI('10.9999/xxxxxx1', spy);

    expect(mockedStore.set).not.toHaveBeenCalled();
  });

  test('should NOT throw if store failure', async () => {
    mockedStore.set.mockRejectedValueOnce(new Error('Store error'));

    bufferedFetchOneDocumentByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        onFetched({ doi: '10.9999/xxxxxx1' });
        return Promise.resolve(true);
      }
    );

    const promise = getDocumentByDOI('10.9999/xxxxxx1', spy);

    await expect(promise).resolves.not.toThrow();
  });

  test('should resolves independent from onDocument', async () => {
    bufferedFetchOneDocumentByDOI.mockImplementationOnce(
      (_remote, _doi, onFetched) => {
        setTimeout(() => {
          onFetched({ doi: '10.9999/xxxxxx1' });
        }, 50);

        return Promise.resolve(true);
      }
    );

    const resolveSpy = vi.fn();
    await getDocumentByDOI('10.9999/xxxxxx1', spy).then(() => resolveSpy());

    await vi.runAllTimersAsync();
    expect(resolveSpy).toHaveBeenCalledBefore(spy);
  });
});
