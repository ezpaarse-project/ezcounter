import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { fetchReportAsStream } from '~/models/data-host';

// ==== Mocked functions
import { createGunzip } from 'node:zlib';
import { createWriteStream, createReadStream } from '~/lib/fs';
import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';
// ====

import { HarvestIdleTimeout } from '~/models/timeout';
import { cacheReport } from './download';

// Mocking unzip
vi.mock(import('node:zlib'));
// Mocking requests
vi.mock(import('~/models/data-host'));
// Mocking events
vi.mock(import('~/queues/harvest/jobs/status'));

const OPTIONS: HarvestDownloadOptions = {
  cacheKey: '',
  dataHost: { auth: {}, baseUrl: '' },
  report: {
    period: { start: '', end: '' },
    reportId: 'ir',
    release: '5.1',
  },
};

describe('Cache report (cacheReport)', () => {
  beforeEach(() => {
    // Clear function history
    vi.clearAllMocks();
  });

  describe('file exists', () => {
    const REPORT = { id: '', path: '/examples/5.1/ir/valid.json' };

    test('should have source "file"', async () => {
      const result = await cacheReport(REPORT, OPTIONS);

      expect(result.source).toBe('file');
      expect(result.httpCode).toBe(undefined);
    });

    test("shouldn't read archive", async () => {
      await cacheReport(REPORT, OPTIONS);

      expect(createGunzip).not.toBeCalled();
    });

    test("shouldn't download", async () => {
      await cacheReport(REPORT, OPTIONS);

      expect(fetchReportAsStream).not.toBeCalled();
    });

    test("shouldn't write file", async () => {
      await cacheReport(REPORT, OPTIONS);

      expect(createWriteStream).not.toBeCalled();
    });

    test("shouldn't notify progress", async () => {
      await cacheReport(REPORT, OPTIONS);

      expect(sendHarvestJobStatusEvent).not.toBeCalled();
    });

    test("shouldn't be able to be aborted", async () => {
      vi.useFakeTimers();
      const timeout = new HarvestIdleTimeout();

      const promise = cacheReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).resolves.not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('archive exists', () => {
    const ARCHIVED_REPORT = {
      id: '',
      path: '/examples/5.1/ir/valid_archived.json',
    };

    test('should have source "archive"', async () => {
      const result = await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(result.source).toBe('archive');
      expect(result.httpCode).toBe(undefined);
    });

    test('should read archive', async () => {
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(createReadStream).toBeCalledWith(`${ARCHIVED_REPORT.path}.gz`);
      expect(createGunzip).toBeCalled();
    });

    test("shouldn't download", async () => {
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(fetchReportAsStream).not.toBeCalled();
    });

    test('should write file', async () => {
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(createWriteStream).toBeCalledWith(ARCHIVED_REPORT.path);
    });

    test('should notify progress', async () => {
      await cacheReport(ARCHIVED_REPORT, OPTIONS);

      expect(sendHarvestJobStatusEvent).toBeCalled();
    });

    test('should be able to be aborted', async () => {
      vi.useFakeTimers();
      const timeout = new HarvestIdleTimeout();

      const promise = cacheReport(ARCHIVED_REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
      vi.useRealTimers();
    });

    test('should tick timeout', async () => {
      const timeout = new HarvestIdleTimeout();
      const spy = vi.spyOn(timeout, 'tick');

      await cacheReport(ARCHIVED_REPORT, OPTIONS, timeout);

      expect(spy).toBeCalled();
    });
  });

  describe('download', () => {
    const NO_REPORT = {
      id: '',
      path: '/examples/5.1/ir/does-not-exists.json',
    };

    test('should have source "remote"', async () => {
      const result = await cacheReport(NO_REPORT, OPTIONS);

      expect(result.source).toBe('remote');
      expect(result.httpCode).not.toBe(undefined);
    });

    test("shouldn't read archive", async () => {
      await cacheReport(NO_REPORT, OPTIONS);

      expect(createGunzip).not.toBeCalled();
    });

    test('should download', async () => {
      await cacheReport(NO_REPORT, OPTIONS);

      expect(fetchReportAsStream).toBeCalled();
    });

    test('should write file', async () => {
      await cacheReport(NO_REPORT, OPTIONS);

      expect(createWriteStream).toBeCalledWith(NO_REPORT.path);
    });

    test('should notify progress', async () => {
      await cacheReport(NO_REPORT, OPTIONS);

      expect(sendHarvestJobStatusEvent).toBeCalled();
    });

    test('should be able to be aborted', async () => {
      vi.useFakeTimers();
      const timeout = new HarvestIdleTimeout();

      const promise = cacheReport(NO_REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
      vi.useRealTimers();
    });

    test('should tick timeout', async () => {
      const timeout = new HarvestIdleTimeout();
      const spy = vi.spyOn(timeout, 'tick');

      await cacheReport(NO_REPORT, OPTIONS, timeout);

      expect(spy).toBeCalled();
    });
  });

  describe('force download', () => {
    const FORCE_OPTIONS: HarvestDownloadOptions = {
      ...OPTIONS,
      report: {
        ...OPTIONS.report,
        forceDownload: true,
      },
    };
    const REPORT = { id: '', path: '/examples/5.1/ir/valid.json' };

    test('should have source "remote"', async () => {
      const result = await cacheReport(REPORT, FORCE_OPTIONS);

      expect(result.source).toBe('remote');
      expect(result.httpCode).not.toBe(undefined);
    });

    test("shouldn't read archive", async () => {
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(createGunzip).not.toBeCalled();
    });

    test('should download', async () => {
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(fetchReportAsStream).toBeCalled();
    });

    test('should write file', async () => {
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(createWriteStream).toBeCalledWith(REPORT.path);
    });

    test('should notify progress', async () => {
      await cacheReport(REPORT, FORCE_OPTIONS);

      expect(sendHarvestJobStatusEvent).toBeCalled();
    });

    test('should be able to be aborted', async () => {
      vi.useFakeTimers();
      const timeout = new HarvestIdleTimeout();

      const promise = cacheReport(REPORT, FORCE_OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
      vi.useRealTimers();
    });

    test('should tick timeout', async () => {
      const timeout = new HarvestIdleTimeout();
      const spy = vi.spyOn(timeout, 'tick');

      await cacheReport(REPORT, FORCE_OPTIONS, timeout);

      expect(spy).toBeCalled();
    });
  });
});
