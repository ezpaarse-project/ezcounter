import { describe, expect, test, vi } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';

import {
  createWriteStream,
  createReadStream,
  unlink,
} from '~/lib/__mocks__/fs';

import { HarvestIdleTimeout } from '~/models/timeout';

import { createGzip } from '~/../__mocks__/zlib';

import { archiveReport } from './archive';

// Mocking unzip
vi.mock(import('node:zlib'));

describe('Archive report (archiveReport)', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      id: 'ir',
      release: '5.1',
    },
  };

  describe("archive doesn't exists", () => {
    const REPORT = {
      id: '',
      path: '/examples/5.1/ir/invalid_item.json',
      cache: { source: 'remote' as const },
    };

    test('should archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).toBeCalled();
    });

    test('should read file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).toBeCalledWith(REPORT.path);
    });

    test('should write archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createWriteStream).toBeCalledWith(`${REPORT.path}.gz`);
    });

    test('should delete file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(unlink).toBeCalledWith(REPORT.path);
    });

    test('should be able to be aborted', async () => {
      const timeout = new HarvestIdleTimeout();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });

  describe('archive exists and file is from remote', () => {
    const REPORT = {
      id: '',
      path: '/examples/5.1/ir/valid.json',
      cache: { source: 'remote' as const },
    };

    test('should archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).toBeCalled();
    });

    test('should read file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).toBeCalledWith(REPORT.path);
    });

    test('should write archive', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createWriteStream).toBeCalledWith(`${REPORT.path}.gz`);
    });

    test('should delete file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(unlink).toBeCalledWith(REPORT.path);
    });

    test('should be able to be aborted', async () => {
      const timeout = new HarvestIdleTimeout();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });

  describe('archive exists and file is from archive', () => {
    const REPORT = {
      id: '',
      path: '/examples/5.1/ir/valid.json',
      cache: { source: 'archive' as const },
    };

    test("shouldn't archive", async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createGzip).not.toBeCalled();
    });

    test("shouldn't read file", async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createReadStream).not.toBeCalled();
    });

    test("shouldn't write archive", async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(createWriteStream).not.toBeCalled();
    });

    test('should delete file', async () => {
      await archiveReport(REPORT, OPTIONS);

      expect(unlink).toBeCalledWith(REPORT.path);
    });

    test("shouldn't be able to be aborted", async () => {
      const timeout = new HarvestIdleTimeout();

      const promise = archiveReport(REPORT, OPTIONS, timeout);

      vi.runAllTimers();

      await expect(promise).resolves.not.toThrow();
    });
  });

  test("should throw if file doesn't exists", async () => {
    const promise = archiveReport(
      {
        id: '',
        path: '/examples/5.1/ir/does-not-exists.json',
        cache: { source: 'remote' as const },
      },
      OPTIONS
    );

    await expect(promise).rejects.toThrowError("isn't downloaded");
  });

  test('should tick timeout', async () => {
    const timeout = new HarvestIdleTimeout();
    const spy = vi.spyOn(timeout, 'tick');

    await archiveReport(
      {
        id: '',
        path: '/examples/5.1/ir/valid.json',
        cache: { source: 'remote' as const },
      },
      OPTIONS,
      timeout
    );

    expect(spy).toBeCalled();
  });
});
