import { describe, expect, test, vi } from 'vitest';

import { mockedRemote } from './remotes/__mocks__';
import { bufferedFetchOneWorkByDOI } from './works';

describe('Fetch Documents by DOI (bufferedFetchOneWorkByDOI)', () => {
  test('should fetch remote using debounce', async () => {
    mockedRemote.fetchManyWorkByDOI.mockResolvedValueOnce([]);

    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx1', vi.fn());
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx2', vi.fn());
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx3', vi.fn());
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx4', vi.fn());

    await vi.runAllTimersAsync();
    expect(mockedRemote.fetchManyWorkByDOI).toHaveBeenCalledExactlyOnceWith([
      '10.9999/xxxxxx1',
      '10.9999/xxxxxx2',
      '10.9999/xxxxxx3',
      '10.9999/xxxxxx4',
    ]);
  });

  test('should pause if buffer is full', async () => {
    mockedRemote.fetchManyWorkByDOI.mockResolvedValueOnce([]);
    const addToBuffer = vi.fn(() =>
      bufferedFetchOneWorkByDOI(mockedRemote, '', vi.fn())
    );

    for (let index = 0; index < 100; index += 1) {
      addToBuffer();
    }

    // Let promises resolves (FETCH_MANY_DEBOUNCE is 1000ms so shouldn't trigger debounce)
    await vi.advanceTimersByTimeAsync(1);

    // MAX_BUFFER_SIZE is 100, 50th call shouldn't be blocking
    expect.soft(addToBuffer).toHaveNthResolvedWith(50, true);
    // 100th should be blocking as buffer is full
    expect.soft(addToBuffer).not.toHaveNthResolvedWith(100, true);

    await vi.runAllTimersAsync();
  });

  test('should trigger every callback', async () => {
    // Deduplicate 10.9999/xxxxxx1 + missing 10.9999/xxxxxx4
    mockedRemote.fetchManyWorkByDOI.mockResolvedValueOnce([
      {
        authorships: [],
        ids: { doi: '10.9999/xxxxxx1', openalex: '' },
        open_access: { is_oa: false, oa_status: 'closed' },
      },
      {
        authorships: [],
        ids: { doi: '10.9999/xxxxxx3', openalex: '' },
        open_access: { is_oa: true, oa_status: 'gold' },
      },
    ]);

    const spy1 = vi.fn();
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx1', spy1);
    const spy2 = vi.fn();
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx1', spy2);
    const spy3 = vi.fn();
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx3', spy3);
    const spy4 = vi.fn();
    await bufferedFetchOneWorkByDOI(mockedRemote, '10.9999/xxxxxx4', spy4);

    await vi.runAllTimersAsync();
    expect(spy1).toHaveBeenCalledExactlyOnceWith({
      authorships: [],
      ids: { doi: '10.9999/xxxxxx1', openalex: '' },
      open_access: { is_oa: false, oa_status: 'closed' },
    });
    expect(spy2).toHaveBeenCalledExactlyOnceWith({
      authorships: [],
      ids: { doi: '10.9999/xxxxxx1', openalex: '' },
      open_access: { is_oa: false, oa_status: 'closed' },
    });
    expect(spy3).toHaveBeenCalledExactlyOnceWith({
      authorships: [],
      ids: { doi: '10.9999/xxxxxx3', openalex: '' },
      open_access: { is_oa: true, oa_status: 'gold' },
    });
    expect(spy4).toHaveBeenCalledExactlyOnceWith(null);
  });
});
