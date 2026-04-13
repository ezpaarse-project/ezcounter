import { Readable, addAbortSignal } from 'node:stream';

import { FetchError } from 'ofetch';
import { vi } from 'vitest';

import type * as original from '..';

/**
 * Util function to create a mocked fetch error
 *
 * @param url - The URL "used" to fetch
 * @param status - The status "returned"
 *
 * @returns The error
 */
export const createFetchError = (url: string, status: number): FetchError => {
  const message = 'mocked fetch error';

  const error = new FetchError(`[GET] ${url}: ${status} mocked fetch error`);

  Object.defineProperties(error, {
    status: { value: status },
    statusCode: { value: status },
    statusMessage: { value: message },
    statusText: { value: message },
  });

  return error;
};

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
      data: stream,
      expectedSize: 0,
      httpCode: 200,
      url: '/foo/bar',
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
