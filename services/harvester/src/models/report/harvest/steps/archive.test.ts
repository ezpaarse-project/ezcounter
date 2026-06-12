import { createGzip } from 'node:zlib';

import { describe, expect, test, vi } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';

import { createReadStream, createWriteStream, exists, unlink } from '~/lib/fs';

import { IdleTimeoutController } from '~/models/idle-timeout';

import { archiveReport } from './archive';

// Mocking unzip
vi.mock(import('node:zlib'));

describe('Archive report (archiveReport)', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    release: '5.1',
    report: {
      id: 'ir',
      period: { end: '', start: '' },
    },
  };

  describe("archive doesn't exists", () => {
    const REPORT = {
      cache: { source: 'remote' as const },
      jobId: '',
      path: '/examples/reports/5.1/ir/invalid_item.json',
    };

    test('should archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).toHaveBeenCalled();
    });

    test('should read file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).toHaveBeenCalledWith(REPORT.path);
    });

    test('should write archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(`${REPORT.path}.gz`)).resolves.toBe(true);
    });

    test('should delete file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(unlink).toHaveBeenCalledWith(REPORT.path);
    });

    test('should be able to be aborted', async () => {
      const timeout = new IdleTimeoutController();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      // TODO: better test
      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('archive exists and file is from remote', () => {
    const REPORT = {
      cache: { source: 'remote' as const },
      jobId: '',
      path: '/examples/reports/5.1/ir/valid.json',
    };

    test('should archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).toHaveBeenCalled();
    });

    test('should read file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).toHaveBeenCalledWith(REPORT.path);
    });

    test('should write archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(`${REPORT.path}.gz`)).resolves.toBe(true);
    });

    test('should delete file', async () => {
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(REPORT.path)).resolves.toBe(false);
    });

    test('should be able to be aborted', async () => {
      const timeout = new IdleTimeoutController();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      // TODO: better test
      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('archive exists and file is from archive', () => {
    const REPORT = {
      cache: { source: 'archive' as const },
      jobId: '',
      path: '/examples/reports/5.1/ir/valid.json',
    };

    test("shouldn't archive", async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).not.toHaveBeenCalled();
    });

    test("shouldn't read file", async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).not.toHaveBeenCalledWith(REPORT.path);
    });

    test("shouldn't write archive", async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createWriteStream).not.toHaveBeenCalledWith(`${REPORT.path}.gz`);
    });

    test('should delete file', async () => {
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(REPORT.path)).resolves.toBe(false);
    });

    test("shouldn't be able to be aborted", async () => {
      const timeout = new IdleTimeoutController();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).resolves.not.toThrow();
    });
  });

  test("should NOT throw if file doesn't exists", async () => {
    const promise = archiveReport(
      {
        cache: { source: 'remote' as const },
        jobId: '',
        path: '/examples/reports/5.1/ir/does-not-exists.json',
      },
      OPTIONS
    );

    await expect(promise).resolves.not.toThrow();
  });

  test('should tick timeout', async () => {
    const timeout = new IdleTimeoutController();
    const spy = vi.spyOn(timeout, 'tick');

    await archiveReport(
      {
        cache: { source: 'remote' as const },
        jobId: '',
        path: '/examples/reports/5.1/ir/valid.json',
      },
      OPTIONS,
      timeout
    );

    expect(spy).toHaveBeenCalled();
  });
});
