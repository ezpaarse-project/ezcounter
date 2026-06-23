import { describe, expect, it, vi } from 'vitest';

import { MAX_BUFFER_SIZE } from '../constants';
// oxlint-disable-next-line vitest/no-mocks-import - Remote should be create by parent
import { mockedRemote } from './remotes/__mocks__';
import { bufferedFetchOneWorkByDOI } from './works';

describe('fetch Documents by DOI', () => {
  it('should fetch remote using debounce', async () => {
    expect.hasAssertions();
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
    expect(mockedRemote.fetchManyWorkByDOI).toHaveBeenCalledExactlyOnceWith([
      '10.9999/xxxxxx1',
      '10.9999/xxxxxx2',
      '10.9999/xxxxxx3',
      '10.9999/xxxxxx4',
    ]);
  });

  it('should pause if buffer is full', async () => {
    expect.hasAssertions();
    vi.mocked(mockedRemote).fetchManyWorkByDOI.mockResolvedValueOnce([]);
    const addToBuffer = vi.fn<() => Promise<boolean>>(() =>
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

  it('should trigger every callback', async () => {
    expect.hasAssertions();
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

    const spy1 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      spy1
    );
    const spy2 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      spy2
    );
    const spy3 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneWorkByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx3',
      spy3
    );
    const spy4 = vi.fn<(...args: unknown[]) => Promise<void>>();
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
