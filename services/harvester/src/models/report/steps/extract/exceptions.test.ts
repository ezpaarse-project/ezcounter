import { describe, expect, test } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { extractReportExceptions } from './exceptions';

describe('COUNTER 5', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      id: 'ir',
      release: '5',
    },
  };

  describe('Report Exceptions (extractReportExceptions)', () => {
    test('should return exceptions', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toBeInstanceOf(Array);
    });

    test('should be empty if no exceptions', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(0);
    });

    test('should have items if exceptions in header', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5/ir/exceptions/in_header.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    test('should have items if exceptions at root', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5/ir/exceptions/root.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    test('should have items if exceptions are array at root', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5/ir/exceptions/root_array.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    test('should throw if one exception is invalid', async () => {
      const promise = extractReportExceptions(
        '/examples/5/ir/exceptions/invalid.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrowError('Exception is invalid');
      await expect(promise).rejects.toHaveProperty('cause.validation');
    });

    test('should throw if not JSON', async () => {
      const promise = extractReportExceptions(
        '/examples/5/ir/invalid.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrowError(
        'Parser cannot parse input: expected a value'
      );
    });

    test("should throw if doesn't exists", async () => {
      const promise = extractReportExceptions(
        '/examples/5/ir/does-not-exists.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrowError('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    test('should be able to be aborted', async () => {
      const controller = new AbortController();

      const promise = extractReportExceptions(
        '/examples/5/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});

describe('COUNTER 5.1', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      id: 'ir',
      release: '5.1',
    },
  };

  describe('Report Exceptions (extractReportExceptions)', () => {
    test('should return exceptions', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5.1/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toBeInstanceOf(Array);
    });

    test('should be empty if no exceptions', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5.1/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(0);
    });

    test('should have items if exceptions in header', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5.1/ir/exceptions/in_header.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    test('should have items if exceptions at root', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5.1/ir/exceptions/root.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    test('should have items if exceptions are array at root', async () => {
      const exceptions = await extractReportExceptions(
        '/examples/5.1/ir/exceptions/root_array.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    test('should throw if one exception is invalid', async () => {
      const promise = extractReportExceptions(
        '/examples/5.1/ir/exceptions/invalid.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrowError('Exception is invalid');
      await expect(promise).rejects.toHaveProperty('cause.validation');
    });

    test('should throw if not JSON', async () => {
      const promise = extractReportExceptions(
        '/examples/5.1/ir/invalid.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrowError(
        'Parser cannot parse input: expected a value'
      );
    });

    test("should throw if doesn't exists", async () => {
      const promise = extractReportExceptions(
        '/examples/5.1/ir/does-not-exists.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrowError('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    test('should be able to be aborted', async () => {
      const controller = new AbortController();

      const promise = extractReportExceptions(
        '/examples/5.1/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});
