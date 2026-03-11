import { Readable, addAbortSignal } from 'node:stream';

import { vi } from 'vitest';

import type * as original from '..';

export const fetchReportAsStream = vi.fn<typeof original.fetchReportAsStream>(
  (_options, signal) => {
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
