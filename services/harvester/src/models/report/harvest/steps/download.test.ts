import { createGunzip } from 'node:zlib';

import { describe, expect, it, vi } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';
import { fetchReportAsStream } from '@ezcounter/counter';

import { createReadStream, createWriteStream, exists } from '~/lib/fs';

import { IdleTimeoutController } from '~/models/idle-timeout';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import { cacheReport } from './download';

// Mocking unzip
vi.mock(import('node:zlib'));
// Mocking events
vi.mock(import('~/queues/harvest/jobs/status'));

const OPTIONS: HarvestDownloadOptions = {
  cacheKey: '',
  dataHost: { auth: {}, baseUrl: '' },
  release: '5.1',
  report: {
    id: 'ir',
    period: { end: '', start: '' },
  },
};

describe('cache report', () => {
  describe('file exists', () => {
    const REPORT = { jobId: '', path: '/examples/reports/5.1/ir/valid.json' };

    it('should have source "file"', async () => {
      expect.hasAssertions();
      const result = await cacheReport(REPORT, OPTIONS);

      expect(result.source).toBe('file');
      expect(result.httpCode).toBeUndefined();
    });

    it("shouldn't read archive", async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, OPTIONS);

      expect(createGunzip).not.toHaveBeenCalled();
    });

    it("shouldn't download", async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, OPTIONS);

      expect(fetchReportAsStream).not.toHaveBeenCalled();
    });

    it("shouldn't write file", async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, OPTIONS);

      expect(createWriteStream).not.toHaveBeenCalledWith(REPORT.path);
    });

    it('should notify progress', async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, OPTIONS);

      expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
        download: {
          source: 'file',
          status: 'done',
        },
        id: '',
        status: 'processing',
      });
    });

    it("shouldn't be able to be aborted", async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();

      const promise = cacheReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).resolves.not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('archive exists', () => {
    const ARCHIVED_REPORT = {
      jobId: '',
      path: '/examples/reports/5.1/ir/valid_archived.json',
    };

    it('should have source "archive"', async () => {
      expect.hasAssertions();
      const result = await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(result.source).toBe('archive');
      expect(result.httpCode).toBeUndefined();
    });

    it('should read archive', async () => {
      expect.hasAssertions();
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(createReadStream).toHaveBeenCalledWith(
        `${ARCHIVED_REPORT.path}.gz`
      );
      expect(createGunzip).toHaveBeenCalledOnce();
    });

    it("shouldn't download", async () => {
      expect.hasAssertions();
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(fetchReportAsStream).not.toHaveBeenCalled();
    });

    it('should write file', async () => {
      expect.hasAssertions();
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      await expect(exists(ARCHIVED_REPORT.path)).resolves.toBe(true);
    });

    it('should notify progress', async () => {
      expect.hasAssertions();
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
        download: {
          source: 'archive',
          status: 'done',
        },
        id: '',
        status: 'processing',
      });
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();

      const promise = cacheReport(ARCHIVED_REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });

    it('should tick timeout', async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();
      const spy = vi.spyOn(timeout, 'tick');

      await cacheReport(ARCHIVED_REPORT, OPTIONS, timeout);

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('download', () => {
    const NO_REPORT = {
      jobId: '',
      path: '/examples/reports/5.1/ir/does-not-exists.json',
    };

    it('should have source "remote"', async () => {
      expect.hasAssertions();
      const result = await cacheReport(NO_REPORT, OPTIONS);

      expect(result.source).toBe('remote');
      expect(result.httpCode).toBeDefined();
    });

    it("shouldn't read archive", async () => {
      expect.hasAssertions();
      await cacheReport(NO_REPORT, OPTIONS);

      expect(createGunzip).not.toHaveBeenCalled();
    });

    it('should download', async () => {
      expect.hasAssertions();
      await cacheReport(NO_REPORT, OPTIONS);

      expect(fetchReportAsStream).toHaveBeenCalledOnce();
    });

    it('should write file', async () => {
      expect.hasAssertions();
      await cacheReport(NO_REPORT, OPTIONS);

      await expect(exists(NO_REPORT.path)).resolves.toBe(true);
    });

    it('should notify progress', async () => {
      expect.hasAssertions();
      await cacheReport(NO_REPORT, OPTIONS);

      expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
        download: {
          source: 'remote',
          status: 'done',
        },
        id: '',
        status: 'processing',
      });
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();

      const promise = cacheReport(NO_REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });

    it('should tick timeout', async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();
      const spy = vi.spyOn(timeout, 'tick');

      await cacheReport(NO_REPORT, OPTIONS, timeout);

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('force download', () => {
    const FORCE_OPTIONS: HarvestDownloadOptions = {
      ...OPTIONS,
      forceDownload: true,
    };
    const REPORT = { jobId: '', path: '/examples/reports/5.1/ir/valid.json' };

    it('should have source "remote"', async () => {
      expect.hasAssertions();
      const result = await cacheReport(REPORT, FORCE_OPTIONS);

      expect(result.source).toBe('remote');
      expect(result.httpCode).toBeDefined();
    });

    it("shouldn't read archive", async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(createGunzip).not.toHaveBeenCalled();
    });

    it('should download', async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(fetchReportAsStream).toHaveBeenCalledOnce();
    });

    it('should write file', async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, FORCE_OPTIONS);

      await expect(exists(REPORT.path)).resolves.toBe(true);
    });

    it('should notify progress', async () => {
      expect.hasAssertions();
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
        download: {
          source: 'remote',
          status: 'done',
        },
        id: '',
        status: 'processing',
      });
    });

    it('should be able to be aborted', async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();

      const promise = cacheReport(REPORT, FORCE_OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });

    it('should tick timeout', async () => {
      expect.hasAssertions();
      const timeout = new IdleTimeoutController();
      const spy = vi.spyOn(timeout, 'tick');

      await cacheReport(REPORT, FORCE_OPTIONS, timeout);

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
