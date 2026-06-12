import { describe, expect, test, vi } from 'vitest';

import { MAX_BUFFER_SIZE } from '../constants';
import { mockedRemote } from './remotes/__mocks__';
import { bufferedFetchOneWorkByDOI } from './works';

describe('Fetch Documents by DOI (bufferedFetchOneWorkByDOI)', () => {
  test('should fetch remote using debounce', async () => {
    vi.mocked(mockedRemote).fetchManyWorkByDOI.mockResolvedValueOnce([]);

    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      vi.fn()
    );
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx2',
      vi.fn()
    );
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx3',
      vi.fn()
    );
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx4',
      vi.fn()
    );

    await vi.runAllTimersAsync();
    expect(
      vi.mocked(mockedRemote).fetchManyWorkByDOI
    ).toHaveBeenCalledExactlyOnceWith([
      '10.9999/xxxxxx1',
      '10.9999/xxxxxx2',
      '10.9999/xxxxxx3',
      '10.9999/xxxxxx4',
    ]);
  });

  test('should pause if buffer is full', async () => {
    vi.mocked(mockedRemote).fetchManyWorkByDOI.mockResolvedValueOnce([]);
    const addToBuffer = vi.fn(() =>
      bufferedFetchOneWorkByDOI(vi.mocked(mockedRemote), '', vi.fn())
    );

    for (let index = 0; index < MAX_BUFFER_SIZE; index += 1) {
      addToBuffer();
    }

    // Let promises resolves
    await vi.advanceTimersByTimeAsync(1);

    // Calls before MAX_BUFFER_SIZE shouldn't be blocking
    expect
      .soft(addToBuffer)
      .toHaveNthResolvedWith(Math.floor(MAX_BUFFER_SIZE / 2), true);
    // Last call should be blocking as buffer is full
    expect.soft(addToBuffer).not.toHaveNthResolvedWith(MAX_BUFFER_SIZE, true);

    await vi.runAllTimersAsync();
  });

  test('should trigger every callback', async () => {
    // Deduplicate 10.9999/xxxxxx1 + missing 10.9999/xxxxxx4
    vi.mocked(mockedRemote).fetchManyWorkByDOI.mockResolvedValueOnce([
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
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      spy1
    );
    const spy2 = vi.fn();
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      spy2
    );
    const spy3 = vi.fn();
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx3',
      spy3
    );
    const spy4 = vi.fn();
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx4',
      spy4
    );

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
