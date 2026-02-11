import { Readable, addAbortSignal } from 'node:stream';

import { vi } from 'vitest';

export const fetchReportAsStream = vi.fn().mockImplementation(
  (
    _options,
    signal?: AbortSignal
  ): Promise<{
    url: string;
    httpCode: number;
    expectedSize: number;
    data: Readable;
  }> => {
    // oxlint-disable-next-line no-empty-function
    const stream = new Readable({ read: (): void => {} });
    stream.push(null);

    if (signal) {
      addAbortSignal(signal, stream);
    }

    // oxlint-disable-next-line prefer-await-to-then
    return Promise.resolve({
      url: '/foo/bar',
      httpCode: 200,
      expectedSize: 0,
      data: stream,
    });
  }
);
