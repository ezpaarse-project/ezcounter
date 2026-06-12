import { Readable } from 'node:stream';

import { describe, expect, test, vi } from 'vitest';

import type { DataHostAuthCheckOptions } from '@ezcounter/dto/data-host';
import { fetchReportAsStream } from '@ezcounter/counter';

import { appConfig } from '~/lib/config';
import { createWriteStream, mkdir, unlink } from '~/lib/fs';

import { extractReportExceptions } from '~/models/report/extraction/exceptions';

import { checkCredentials } from './check';

vi.mock(import('~/models/report/extraction/exceptions'));

describe('Credentials Check (checkCredentials)', () => {
  test('should fetch report', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: 'https://counter.localhost/',
      },
      release: '5',
      report: { id: 'tr', period: { end: '2025-01', start: '2025-01' } },
    };

    await checkCredentials(options);

    expect.soft(fetchReportAsStream).toHaveBeenCalledExactlyOnceWith(
      '5',
      { id: 'tr', period: { end: '2025-01', start: '2025-01' } },
      expect.objectContaining({
        auth: {},
        baseUrl: 'https://counter.localhost/',
      })
    );

    await vi.runAllTimersAsync();
  });

  test('should set period to 3 months prior if not provided', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);
    vi.setSystemTime(new Date(2025, 5));

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: 'https://counter.localhost/',
      },
      release: '5',
      report: { id: 'pr' },
    };

    await checkCredentials(options);

    expect.soft(fetchReportAsStream).toHaveBeenCalledExactlyOnceWith(
      '5',
      { id: 'pr', period: { end: '2025-03', start: '2025-03' } },
      expect.objectContaining({
        auth: {},
        baseUrl: 'https://counter.localhost/',
      })
    );

    await vi.runAllTimersAsync();
  });

  test('should write file into temp dir', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    await checkCredentials(options);

    expect
      .soft(createWriteStream)
      .toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(appConfig.temp.dir),
        'utf8'
      );

    await vi.runAllTimersAsync();
  });

  test('should ignore non auth related exceptions', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([
      {
        Code: '1010',
        Message: 'Service is busy',
      },
    ]);

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const promise = checkCredentials(options);

    await expect.soft(promise).resolves.toHaveProperty('success', true);
    await expect.soft(promise).resolves.toHaveProperty('errors.length', 0);

    await vi.runAllTimersAsync();
  });

  test('should return HTTP errors', async () => {
    vi.mocked(fetchReportAsStream).mockImplementationOnce(
      (_release, _report) => {
        // oxlint-disable-next-line no-empty-function
        const stream = new Readable({ read: (): void => {} });
        stream.push('{}\n');
        stream.push(null);
        // oxlint-disable-next-line prefer-await-to-then
        return Promise.resolve({
          data: stream,
          expectedSize: 0,
          httpCode: 514,
          url: '/foo/bar',
        });
      }
    );

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const promise = checkCredentials(options);

    await expect.soft(promise).resolves.toHaveProperty('success', false);
    await expect
      .soft(promise)
      .resolves.toHaveProperty('errors.0.code', 'http:514');

    await vi.runAllTimersAsync();
  });

  test('should return auth related exceptions', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([
      {
        Code: '2000',
        Message: 'Requestor Not Authorized to Access Service',
      },
    ]);

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const promise = checkCredentials(options);

    await expect.soft(promise).resolves.toHaveProperty('success', false);
    await expect
      .soft(promise)
      .resolves.toHaveProperty('errors.0.code', 'counter:2000');

    await vi.runAllTimersAsync();
  });

  test('should return error if exception is invalid', async () => {
    vi.mocked(extractReportExceptions).mockRejectedValueOnce(
      new Error('Invalid exception')
    );

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const promise = checkCredentials(options);

    await expect.soft(promise).resolves.toHaveProperty('success', false);
    await expect
      .soft(promise)
      .resolves.toHaveProperty('errors.0.code', 'app:ERROR');

    await vi.runAllTimersAsync();
  });

  test('should delete temporary report', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    await checkCredentials(options);

    expect.soft(unlink).toHaveBeenCalledOnce();

    await vi.runAllTimersAsync();
  });

  test('should return error if unable to cache report', async () => {
    vi.mocked(mkdir).mockRejectedValueOnce(new Error('Folder error'));

    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const promise = checkCredentials(options);

    await expect.soft(promise).resolves.toHaveProperty('success', false);
    await expect
      .soft(promise)
      .resolves.toHaveProperty('errors.0.code', 'app:ERROR');

    await vi.runAllTimersAsync();
  });
});
