import { createGzip } from 'node:zlib';

import { describe, expect, it, vi } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';

import { createReadStream, createWriteStream, exists, unlink } from '~/lib/fs';

import { IdleTimeoutController } from '~/models/idle-timeout';

import { archiveReport } from './archive';

// Mocking unzip
vi.mock(import('node:zlib'));

describe('archive report', () => {
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

    it('should archive', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).toHaveBeenCalledOnce();
    });

    it('should read file', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).toHaveBeenCalledWith(REPORT.path);
    });

    it('should write archive', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(`${REPORT.path}.gz`)).resolves.toBe(true);
    });

    it('should delete file', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(unlink).toHaveBeenCalledWith(REPORT.path);
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
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

    it('should archive', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).toHaveBeenCalledOnce();
    });

    it('should read file', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).toHaveBeenCalledWith(REPORT.path);
    });

    it('should write archive', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(`${REPORT.path}.gz`)).resolves.toBe(true);
    });

    it('should delete file', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(REPORT.path)).resolves.toBe(false);
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
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

    it("shouldn't archive", async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).not.toHaveBeenCalled();
    });

    it("shouldn't read file", async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).not.toHaveBeenCalledWith(REPORT.path);
    });

    it("shouldn't write archive", async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      expect(createWriteStream).not.toHaveBeenCalledWith(`${REPORT.path}.gz`);
    });

    it('should delete file', async () => {
      expect.hasAssertions();
      await archiveReport(REPORT, OPTIONS);

      await expect(exists(REPORT.path)).resolves.toBe(false);
    });

    it("shouldn't be able to be aborted", async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).resolves.not.toThrow();
    });
  });

  it("should NOT throw if file doesn't exists", async () => {
    expect.hasAssertions();
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

  it('should tick timeout', async () => {
    expect.hasAssertions();
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

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
