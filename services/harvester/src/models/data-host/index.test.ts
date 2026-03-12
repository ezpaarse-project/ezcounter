import { Readable } from 'node:stream';

import { fs } from 'memfs';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { fetchReportAsStream, fetchReportList } from '.';

const server = setupServer(
  // COUNTER 5.1
  http.get('https://counter-example.com/r51/reports', () => {
    const path = '/examples/5.1/list.json';
    const stream = Readable.toWeb(fs.createReadStream(path));

    return new HttpResponse(stream);
  }),
  http.get('https://counter-example.com/r51/reports/ir', async () => {
    const path = '/examples/5.1/ir/valid.json';
    const stat = await fs.promises.stat(path);
    const stream = Readable.toWeb(fs.createReadStream(path));

    return new HttpResponse(stream, {
      headers: {
        'Content-Length': `${stat.size}`,
      },
    });
  }),
  http.get('https://invalid.counter-example.com/r51/reports', () => {
    const path = '/examples/5.1/list_invalid.json';
    const stream = Readable.toWeb(fs.createReadStream(path));

    return new HttpResponse(stream);
  }),
  http.get('https://error.counter-example.com/r51/reports', () =>
    HttpResponse.json({}, { status: 404 })
  ),
  http.get(
    'https://error.counter-example.com/r51/reports/ir',
    () => new HttpResponse('{}', { status: 404 })
  )
);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers());
// Close server after all tests
afterAll(() => server.close());

const generateOptions = (
  baseUrl: string,
  reportId: string,
  release: '5' | '5.1'
): HarvestDownloadOptions => ({
  cacheKey: '',
  dataHost: {
    auth: {},
    baseUrl,
  },
  report: {
    id: reportId,
    period: { start: '2025-01', end: '2025-12' },
    release,
  },
});

describe('COUNTER 5.1', () => {
  const VALID_OPTIONS = generateOptions(
    'https://counter-example.com/r51',
    'ir',
    '5.1'
  );
  const INVALID_OPTIONS = generateOptions(
    'https://invalid.counter-example.com/r51',
    'ir',
    '5.1'
  );
  const ERROR_OPTIONS = generateOptions(
    'https://error.counter-example.com/r51',
    'ir',
    '5.1'
  );

  describe('GET /reports (fetchReportList)', () => {
    test('should return a list of reports', async () => {
      const data = await fetchReportList(VALID_OPTIONS.dataHost);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
    });

    test('should throw if an item is invalid', async () => {
      const promise = fetchReportList(INVALID_OPTIONS.dataHost);

      await expect(promise).rejects.toThrow('Invalid input');
    });

    test('should throw if an list is empty', async () => {
      const promise = fetchReportList(ERROR_OPTIONS.dataHost);

      await expect(promise).rejects.toThrow('404 Not Found');
    });
  });

  describe('GET /reports/<report> (fetchReportAsStream)', () => {
    test('should return a stream', async () => {
      const { data } = await fetchReportAsStream(VALID_OPTIONS);

      expect(data).toBeInstanceOf(Readable);

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should return the URL used', async () => {
      const { url, data } = await fetchReportAsStream(VALID_OPTIONS);

      expect(url).toBeTypeOf('string');
      expect(URL.canParse(url)).toBe(true);

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should accept param with multiple values', async () => {
      const options = {
        ...VALID_OPTIONS,
        report: {
          ...VALID_OPTIONS.report,
          params: {
            access_method: ['Regular', 'TDM'],
          },
        },
      };

      const { url, data } = await fetchReportAsStream(options);
      const result = new URL(url);

      expect(result.searchParams.get('access_method')).toBe('Regular|TDM');

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should join params with custom separator', async () => {
      const options = {
        ...VALID_OPTIONS,
        report: {
          ...VALID_OPTIONS.report,
          params: {
            access_method: ['Regular', 'TDM'],
          },
        },
        dataHost: {
          ...VALID_OPTIONS.dataHost,
          paramsSeparator: ',',
        },
      };

      const { url, data } = await fetchReportAsStream(options);
      const result = new URL(url);

      expect(result.searchParams.get('access_method')).toBe('Regular,TDM');

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should accept param as boolean', async () => {
      const options = {
        ...VALID_OPTIONS,
        report: {
          ...VALID_OPTIONS.report,
          params: {
            attributed: false,
          },
        },
      };

      const { url, data } = await fetchReportAsStream(options);

      expect(url).toContain('attributed=False');

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should format the period', async () => {
      const { url, data } = await fetchReportAsStream(VALID_OPTIONS);
      const result = new URL(url);

      expect(result.searchParams.get('begin_date')).toBe('2025-01-01');
      expect(result.searchParams.get('end_date')).toBe('2025-12-31');

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should format the period using custom format', async () => {
      const options = {
        ...VALID_OPTIONS,
        dataHost: {
          ...VALID_OPTIONS.dataHost,
          periodFormat: 'yyyy-MM',
        },
      };

      const { url, data } = await fetchReportAsStream(options);
      const result = new URL(url);

      expect(result.searchParams.get('begin_date')).toBe('2025-01');
      expect(result.searchParams.get('end_date')).toBe('2025-12');

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should return the expected size', async () => {
      const { expectedSize, data } = await fetchReportAsStream(VALID_OPTIONS);

      expect(expectedSize).toBeGreaterThan(0);

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should not throw if not found', async () => {
      const { httpCode, data } = await fetchReportAsStream(ERROR_OPTIONS);

      expect(httpCode).toBe(404);

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should return NaN if size not available', async () => {
      const { expectedSize, data } = await fetchReportAsStream(ERROR_OPTIONS);

      expect(expectedSize).toBe(Number.NaN);

      // Destroying stream to avoid EBADF errors
      data.destroy();
    });

    test('should be able to be aborted', async () => {
      const controller = new AbortController();

      const promise = fetchReportAsStream(VALID_OPTIONS, controller.signal);

      controller.abort();

      await expect(promise).rejects.toThrow('This operation was aborted');
    });
  });
});
