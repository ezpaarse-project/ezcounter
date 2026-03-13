import { describe, expect, test, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/models/queues';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/__mocks__/status';

import { handleExceptions, reharvestOrMarkAsError } from '.';

vi.mock(import('~/queues/harvest/jobs/status'));
vi.mock(import('./steps'));

describe('Report Exceptions (handleExceptions)', () => {
  test('should return null if no exceptions', () => {
    const result = handleExceptions([]);

    expect(result).toBe(null);
  });

  test('should return null if no error exceptions', () => {
    const result = handleExceptions([
      {
        code: 'foobar',
        severity: 'warn',
        message: '',
      },
      {
        code: 'barfoo',
        severity: 'info',
        message: '',
      },
    ]);

    expect(result).toBe(null);
  });

  test('should return processing if report is processing', () => {
    const result = handleExceptions([
      {
        code: 'counter:1011',
        severity: 'info',
        message: '',
      },
      {
        code: 'unknown_error',
        severity: 'error',
        message: '',
      },
    ]);

    expect(result).toHaveProperty('processing', true);
  });

  test('should return unavailable if data host is unavailable', () => {
    const result = handleExceptions([
      {
        code: 'counter:1000',
        severity: 'error',
        message: '',
      },
      {
        code: 'unknown_error',
        severity: 'error',
        message: '',
      },
    ]);

    expect(result).toHaveProperty('unavailable', true);
  });

  test('should throw last HarvestError if error exception', () => {
    let error: unknown;
    try {
      handleExceptions([
        {
          code: 'unknown_error',
          severity: 'error',
          message: '',
        },
        {
          code: 'counter:3020',
          severity: 'error',
          message: '',
        },
      ]);
    } catch (err) {
      error = err;
    }

    expect(error).toMatchObject({
      code: 'counter:3020',
      severity: 'error',
      message: '',
    });
  });
});

describe('Re-harvest or return error (reharvestOrMarkAsError)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getOptions = (): HarvestJobData => ({
    id: '',
    download: {
      report: {
        id: '',
        period: { start: '', end: '' },
        release: '5.1',
      },
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      cacheKey: '',
    },
    insert: {
      index: '',
    },
  });

  test('should return null if file is not from remote', () => {
    const options = getOptions();

    const result = reharvestOrMarkAsError(
      { path: '', cache: { source: 'archive' } },
      options,
      new Error('Error')
    );

    expect(result).toBe(null);
  });

  test('should set forceDownload if file is not from remote', () => {
    const options = getOptions();

    reharvestOrMarkAsError(
      { path: '', cache: { source: 'archive' } },
      options,
      new Error('Error')
    );

    expect(options).toHaveProperty('download.forceDownload', true);
  });

  test('should set forceDownload if file is not from remote', () => {
    const options = getOptions();

    reharvestOrMarkAsError(
      { path: '', cache: { source: 'archive' } },
      options,
      new Error('Error')
    );

    expect(options).toHaveProperty('download.forceDownload', true);
  });

  test('should return that harvest failed if from remote', () => {
    const options = getOptions();

    const result = reharvestOrMarkAsError(
      { path: '', cache: { source: 'remote', httpCode: 500 } },
      options,
      new Error('Error')
    );

    expect(result).toHaveProperty('success', false);
  });

  test('should notify that harvest failed if from remote', () => {
    const options = getOptions();

    reharvestOrMarkAsError(
      { path: '', cache: { source: 'remote', httpCode: 500 } },
      options,
      new Error('Error')
    );

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: options.id,
      status: 'error',
      error: {
        code: 'app:ERROR',
        message: 'Error',
      },
    });
  });
});
