import { describe, expect, it } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';

import { extractReportExceptions } from './exceptions';

describe('counter 5', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    release: '5',
    report: {
      id: 'ir',
      period: { end: '', start: '' },
    },
  };

  describe('extract report exceptions', () => {
    it('should return exceptions', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toBeInstanceOf(Array);
    });

    it('should be empty if no exceptions', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(0);
    });

    it('should have items if exceptions in header', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5/ir/exceptions/in_header.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    it('should have items if exceptions at root', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5/ir/exceptions/root.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    it('should have items if exceptions are array at root', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5/ir/exceptions/root_array.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    it('should throw if one exception is invalid', async () => {
      expect.hasAssertions();
      const promise = extractReportExceptions(
        '/examples/reports/5/ir/exceptions/invalid.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('Exception is invalid');
      await expect(promise).rejects.toHaveProperty('cause.validation');
    });

    it('should throw if not JSON', async () => {
      expect.hasAssertions();
      const promise = extractReportExceptions(
        '/examples/reports/5/ir/invalid.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow(
        'Parser cannot parse input: expected a value'
      );
    });

    it("should throw if doesn't exists", async () => {
      expect.hasAssertions();
      const promise = extractReportExceptions(
        '/examples/reports/5/ir/does-not-exists.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
      const controller = new AbortController();

      const promise = extractReportExceptions(
        '/examples/reports/5/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});

describe('counter 5.1', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    release: '5.1',
    report: {
      id: 'ir',
      period: { end: '', start: '' },
    },
  };

  describe('extract report exceptions', () => {
    it('should return exceptions', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5.1/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toBeInstanceOf(Array);
    });

    it('should be empty if no exceptions', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5.1/ir/valid.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(0);
    });

    it('should have items if exceptions in header', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5.1/ir/exceptions/in_header.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    it('should have items if exceptions at root', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5.1/ir/exceptions/root.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    it('should have items if exceptions are array at root', async () => {
      expect.hasAssertions();
      const exceptions = await extractReportExceptions(
        '/examples/reports/5.1/ir/exceptions/root_array.json',
        OPTIONS
      );

      expect(exceptions).toHaveLength(1);
    });

    it('should throw if one exception is invalid', async () => {
      expect.hasAssertions();
      const promise = extractReportExceptions(
        '/examples/reports/5.1/ir/exceptions/invalid.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('Exception is invalid');
      await expect(promise).rejects.toHaveProperty('cause.validation');
    });

    it('should throw if not JSON', async () => {
      expect.hasAssertions();
      const promise = extractReportExceptions(
        '/examples/reports/5.1/ir/invalid.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow(
        'Parser cannot parse input: expected a value'
      );
    });

    it("should throw if doesn't exists", async () => {
      expect.hasAssertions();
      const promise = extractReportExceptions(
        '/examples/reports/5.1/ir/does-not-exists.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
      const controller = new AbortController();

      const promise = extractReportExceptions(
        '/examples/reports/5.1/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});
