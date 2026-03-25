import { Readable, addAbortSignal } from 'node:stream';

import { vi } from 'vitest';

import type * as original from '..';

export const PERIOD_FORMAT = 'yyyy-MM';

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

export const getStandardReportIDs = vi
  .fn<typeof original.getStandardReportIDs>()
  // Using every report from every COUNTER version
  .mockReturnValue([
    'pr',
    'pr_p1',
    'dr',
    'dr_d1',
    'dr_d2',
    'tr',
    'tr_b1',
    'tr_b2',
    'tr_b3',
    'tr_j1',
    'tr_j2',
    'tr_j3',
    'tr_j4',
    'ir',
    'ir_a1',
    'ir_m1',
  ]);
