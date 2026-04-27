import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { fetchR51ReportAsStream, fetchR51ReportList } from './r51';

const EXAMPLES_DIR = join(
  import.meta.dirname,
  '../../__tests__/examples/reports/5.1'
);

describe('GET /reports (fetchR51ReportList)', () => {
  const server = setupServer(
    http.get('https://valid-response.localhost/r51/reports', () => {
      const path = join(EXAMPLES_DIR, 'list.json');
      const stream = Readable.toWeb(createReadStream(path));

      return new HttpResponse(stream);
    }),
    http.get('https://invalid-response.localhost/r51/reports', () => {
      const path = join(EXAMPLES_DIR, 'list_invalid.json');
      const stream = Readable.toWeb(createReadStream(path));

      return new HttpResponse(stream);
    }),
    http.get('https://object-response.localhost/r51/reports', () =>
      HttpResponse.json({})
    ),
    http.get('https://empty-response.localhost/r51/reports', () =>
      HttpResponse.json([])
    ),
    http.get('https://nok-response.localhost/r51/reports', () =>
      HttpResponse.json([], { status: 404 })
    )
  );

  // Start server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  // Reset handlers after each test for test isolation
  afterEach(() => {
    server.resetHandlers();
  });
  // Close server after all tests
  afterAll(() => {
    server.close();
  });

  test('should return a list of reports', async () => {
    const data = await fetchR51ReportList({
      auth: {},
      baseUrl: 'https://valid-response.localhost/r51',
      userAgent: '',
    });

    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
  });

  test('should throw if an item is invalid', async () => {
    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://invalid-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow(
      "An item in report list doesn't match schema"
    );
  });

  test('should throw if not an array', async () => {
    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://object-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow('Expected "array", found "object"');
  });

  test('should throw if list is empty', async () => {
    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://empty-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow(
      'Expected "length" to be at least "1", found "0"'
    );
  });

  test('should throw if non 200 is returned', async () => {
    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://nok-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow('404 Not Found');
  });
});

describe('GET /reports/<report> (fetchR51ReportAsStream)', () => {
  const server = setupServer(
    http.get('https://valid-response.localhost/r51/reports/ir', async () => {
      const path = join(EXAMPLES_DIR, 'ir/valid.json');
      const stats = await stat(path);
      const stream = Readable.toWeb(createReadStream(path));

      return new HttpResponse(stream, {
        headers: {
          'Content-Length': `${stats.size}`,
        },
      });
    }),
    http.get(
      'https://empty-response.localhost/r51/reports/ir',
      () => new HttpResponse('{}', { status: 404 })
    )
  );

  // Start server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  // Reset handlers after each test for test isolation
  afterEach(() => {
    server.resetHandlers();
  });
  // Close server after all tests
  afterAll(() => {
    server.close();
  });

  test('should return a stream', async () => {
    const { data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        userAgent: '',
      }
    );

    expect(data).toBeInstanceOf(Readable);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should return the URL used', async () => {
    const { url, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        userAgent: '',
      }
    );

    expect(url).toBeTypeOf('string');
    expect(URL.canParse(url)).toBe(true);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should accept param with multiple values', async () => {
    const { url, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        params: {
          access_method: ['Regular', 'TDM'],
        },
        userAgent: '',
      }
    );
    const result = new URL(url);

    expect(result.searchParams.get('access_method')).toBe('Regular|TDM');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should join params with custom separator', async () => {
    const { url, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        params: {
          access_method: ['Regular', 'TDM'],
        },
        paramsSeparator: ',',
        userAgent: '',
      }
    );
    const result = new URL(url);

    expect(result.searchParams.get('access_method')).toBe('Regular,TDM');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should accept param as boolean', async () => {
    const { url, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        params: {
          attributed: false,
        },
        userAgent: '',
      }
    );

    expect(url).toContain('attributed=False');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should format the period', async () => {
    const { url, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        userAgent: '',
      }
    );
    const result = new URL(url);

    expect(result.searchParams.get('begin_date')).toBe('2025-01-01');
    expect(result.searchParams.get('end_date')).toBe('2025-12-31');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should format the period using custom format', async () => {
    const { url, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
        periodFormat: 'yyyy-MM',
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        userAgent: '',
      }
    );
    const result = new URL(url);

    expect(result.searchParams.get('begin_date')).toBe('2025-01');
    expect(result.searchParams.get('end_date')).toBe('2025-12');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should return the expected size', async () => {
    const { expectedSize, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        userAgent: '',
      }
    );

    expect(expectedSize).toBeGreaterThan(0);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should not throw if not found', async () => {
    const { httpCode, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://empty-response.localhost/r51',
        userAgent: '',
      }
    );

    expect(httpCode).toBe(404);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should return NaN if size not available', async () => {
    const { expectedSize, data } = await fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://empty-response.localhost/r51',
        userAgent: '',
      }
    );

    expect(expectedSize).toBe(Number.NaN);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  test('should be able to be aborted', async () => {
    const controller = new AbortController();

    const promise = fetchR51ReportAsStream(
      {
        id: 'ir',
        period: { end: '2025-12', start: '2025-01' },
      },
      {
        auth: {},
        baseUrl: 'https://valid-response.localhost/r51',
        signal: controller.signal,
        userAgent: '',
      }
    );

    controller.abort();

    await expect(promise).rejects.toThrow('This operation was aborted');
  });
});
