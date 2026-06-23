import { describe, expect, it, vi } from 'vitest';

import { MAX_BUFFER_SIZE } from './constants';
import { bufferedFetchOneDocumentByDOI } from './documents';
// oxlint-disable-next-line vitest/no-mocks-import - Remote should be create by parent
import { mockedRemote } from './remotes/__mocks__';

describe('fetch Documents by DOI', () => {
  it('should fetch remote using debounce', async () => {
    expect.hasAssertions();
    vi.mocked(mockedRemote).fetchManyDocumentByDOI.mockResolvedValueOnce([]);

    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      vi.fn()
    );
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx2',
      vi.fn()
    );
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx3',
      vi.fn()
    );
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
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

  it('should pause if buffer is full', async () => {
    expect.hasAssertions();
    vi.mocked(mockedRemote).fetchManyDocumentByDOI.mockResolvedValueOnce([]);
    const addToBuffer = vi.fn<() => Promise<boolean>>(() =>
      bufferedFetchOneDocumentByDOI(vi.mocked(mockedRemote), '', vi.fn())
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
    vi.mocked(mockedRemote).fetchManyDocumentByDOI.mockResolvedValueOnce([
      { doi: '10.9999/xxxxxx1' },
      { doi: '10.9999/xxxxxx3' },
    ]);

    const spy1 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      spy1
    );
    const spy2 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx1',
      spy2
    );
    const spy3 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx3',
      spy3
    );
    const spy4 = vi.fn<(...args: unknown[]) => Promise<void>>();
    await bufferedFetchOneDocumentByDOI(
      vi.mocked(mockedRemote),
      '10.9999/xxxxxx4',
      spy4
    );

    await vi.runAllTimersAsync();
    expect(spy1).toHaveBeenCalledExactlyOnceWith({ doi: '10.9999/xxxxxx1' });
    expect(spy2).toHaveBeenCalledExactlyOnceWith({ doi: '10.9999/xxxxxx1' });
    expect(spy3).toHaveBeenCalledExactlyOnceWith({ doi: '10.9999/xxxxxx3' });
    expect(spy4).toHaveBeenCalledExactlyOnceWith(null);
  });
});
