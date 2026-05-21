import { describe, expect, test, vi } from 'vitest';

import { bufferedFetchOneDocumentByDOI } from './documents';
import { mockedRemote } from './remotes/__mocks__';

describe('Fetch Documents by DOI (bufferedFetchOneDocumentByDOI)', () => {
  test('should fetch remote using debounce', async () => {
    mockedRemote.fetchManyDocumentByDOI.mockResolvedValueOnce([]);

    await bufferedFetchOneDocumentByDOI(
      mockedRemote,
      '10.9999/xxxxxx1',
      vi.fn()
    );
    await bufferedFetchOneDocumentByDOI(
      mockedRemote,
      '10.9999/xxxxxx2',
      vi.fn()
    );
    await bufferedFetchOneDocumentByDOI(
      mockedRemote,
      '10.9999/xxxxxx3',
      vi.fn()
    );
    await bufferedFetchOneDocumentByDOI(
      mockedRemote,
      '10.9999/xxxxxx3',
      vi.fn()
    );

    await vi.runAllTimersAsync();
    expect(mockedRemote.fetchManyDocumentByDOI).toHaveBeenCalledExactlyOnceWith(
      [
        '10.9999/xxxxxx1',
        '10.9999/xxxxxx2',
        '10.9999/xxxxxx3',
        '10.9999/xxxxxx3',
      ]
    );
  });

  test('should pause if buffer is full', async () => {
    mockedRemote.fetchManyDocumentByDOI.mockResolvedValueOnce([]);
    const addToBuffer = vi.fn(() =>
      bufferedFetchOneDocumentByDOI(mockedRemote, '', vi.fn())
    );

    for (let index = 0; index < 1000; index += 1) {
      addToBuffer();
    }

    // Let promises resolves (FETCH_MANY_DEBOUNCE is 500ms so shouldn't trigger debounce)
    await vi.advanceTimersByTimeAsync(1);

    // MAX_BUFFER_SIZE is 1000, 500th call shouldn't be blocking
    expect.soft(addToBuffer).toHaveNthResolvedWith(500, true);
    // 1000th should be blocking as buffer is full
    expect.soft(addToBuffer).not.toHaveNthResolvedWith(1000, true);

    await vi.runAllTimersAsync();
  });

  test('should trigger every callback', async () => {
    // Deduplicate 10.9999/xxxxxx1 + missing 10.9999/xxxxxx4
    mockedRemote.fetchManyDocumentByDOI.mockResolvedValueOnce([
      { doi: '10.9999/xxxxxx1' },
      { doi: '10.9999/xxxxxx3' },
    ]);

    const spy1 = vi.fn();
    await bufferedFetchOneDocumentByDOI(mockedRemote, '10.9999/xxxxxx1', spy1);
    const spy2 = vi.fn();
    await bufferedFetchOneDocumentByDOI(mockedRemote, '10.9999/xxxxxx1', spy2);
    const spy3 = vi.fn();
    await bufferedFetchOneDocumentByDOI(mockedRemote, '10.9999/xxxxxx3', spy3);
    const spy4 = vi.fn();
    await bufferedFetchOneDocumentByDOI(mockedRemote, '10.9999/xxxxxx4', spy4);

    await vi.runAllTimersAsync();
    expect(spy1).toHaveBeenCalledExactlyOnceWith({ doi: '10.9999/xxxxxx1' });
    expect(spy2).toHaveBeenCalledExactlyOnceWith({ doi: '10.9999/xxxxxx1' });
    expect(spy3).toHaveBeenCalledExactlyOnceWith({ doi: '10.9999/xxxxxx3' });
    expect(spy4).toHaveBeenCalledExactlyOnceWith(null);
  });
});
