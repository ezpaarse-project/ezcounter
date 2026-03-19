import { Readable, addAbortSignal } from 'node:stream';

import { vi } from 'vitest';

import type * as original from '.';

export const fetchReportList = vi
  .fn<typeof original.fetchReportList>()
  .mockResolvedValue([]);

export const fetchReportAsStream = vi.fn<typeof original.fetchReportAsStream>(
  (_release, _report, options) => {
    // oxlint-disable-next-line no-empty-function
    const stream = new Readable({ read: (): void => {} });
    stream.push(null);

    if (options.signal) {
      addAbortSignal(options.signal, stream);
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
