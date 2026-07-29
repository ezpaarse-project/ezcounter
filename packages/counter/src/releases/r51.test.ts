import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { fetchR51ReportAsStream, fetchR51ReportList } from './r51';

const EXAMPLES_DIR = join(process.cwd(), '__tests__/examples/reports/5.1');

describe('fetch COUNTER 5 report list (get /reports)', () => {
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

  it('should return a list of reports', async () => {
    expect.assertions(2);

    const data = await fetchR51ReportList({
      auth: {},
      baseUrl: 'https://valid-response.localhost/r51',
      userAgent: '',
    });

    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should throw if an item is invalid', async () => {
    expect.assertions(1);

    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://invalid-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow(
      "An item in report list doesn't match schema"
    );
  });

  it('should throw if not an array', async () => {
    expect.assertions(1);

    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://object-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow('Expected "array", found "object"');
  });

  it('should throw if list is empty', async () => {
    expect.assertions(1);

    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://empty-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow(
      'Expected "length" to be at least "1", found "0"'
    );
  });

  it('should throw if non 200 is returned', async () => {
    expect.assertions(1);

    const promise = fetchR51ReportList({
      auth: {},
      baseUrl: 'https://nok-response.localhost/r51',
      userAgent: '',
    });

    await expect(promise).rejects.toThrow('404 Not Found');
  });
});

describe('fetch COUNTER 5.1 report as stream (get /reports/<report>)', () => {
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

  it('should return a stream', async () => {
    expect.assertions(1);

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

    expect.soft(data).toBeInstanceOf(Readable);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should return the URL used', async () => {
    expect.assertions(2);

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

    expect.soft(url).toBeTypeOf('string');
    expect.soft(URL.canParse(url)).toBe(true);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should accept param with multiple values', async () => {
    expect.assertions(1);

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

    expect.soft(result.searchParams.get('access_method')).toBe('Regular|TDM');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should join params with custom separator', async () => {
    expect.assertions(1);

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

    expect.soft(result.searchParams.get('access_method')).toBe('Regular,TDM');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should accept param as boolean', async () => {
    expect.assertions(1);

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

    expect.soft(url).toContain('attributed=False');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should format the period', async () => {
    expect.assertions(2);

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

    expect.soft(result.searchParams.get('begin_date')).toBe('2025-01-01');
    expect.soft(result.searchParams.get('end_date')).toBe('2025-12-31');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should format the period using custom format', async () => {
    expect.assertions(2);

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

    expect.soft(result.searchParams.get('begin_date')).toBe('2025-01');
    expect.soft(result.searchParams.get('end_date')).toBe('2025-12');

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should return the expected size', async () => {
    expect.assertions(1);

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

    expect.soft(expectedSize).toBeGreaterThan(0);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should not throw if not found', async () => {
    expect.assertions(1);

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

    expect.soft(httpCode).toBe(404);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should return 0 if size not available', async () => {
    expect.assertions(1);

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

    expect.soft(expectedSize).toBe(0);

    // Destroying stream to avoid EBADF errors
    data.destroy();
  });

  it('should be able to be aborted', async () => {
    expect.assertions(1);

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
