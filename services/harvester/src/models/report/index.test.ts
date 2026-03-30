import { describe, expect, test, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

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
        message: '',
        severity: 'warn',
      },
      {
        code: 'barfoo',
        message: '',
        severity: 'info',
      },
    ]);

    expect(result).toBe(null);
  });

  test('should return processing if report is processing', () => {
    const result = handleExceptions([
      {
        code: 'counter:1011',
        message: '',
        severity: 'info',
      },
      {
        code: 'unknown_error',
        message: '',
        severity: 'error',
      },
    ]);

    expect(result).toHaveProperty('processing', true);
  });

  test('should return unavailable if data host is unavailable', () => {
    const result = handleExceptions([
      {
        code: 'counter:1000',
        message: '',
        severity: 'error',
      },
      {
        code: 'unknown_error',
        message: '',
        severity: 'error',
      },
    ]);

    expect(result).toHaveProperty('unavailable', true);
  });

  test('should throw last HarvestError if error exception', () => {
    let err: unknown = null;
    try {
      handleExceptions([
        {
          code: 'unknown_error',
          message: '',
          severity: 'error',
        },
        {
          code: 'counter:3020',
          message: '',
          severity: 'error',
        },
      ]);
    } catch (error) {
      err = error;
    }

    expect(err).toMatchObject({
      code: 'counter:3020',
      message: '',
      severity: 'error',
    });
  });
});

describe('Re-harvest or return error (reharvestOrMarkAsError)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getOptions = (): HarvestJobData => ({
    download: {
      cacheKey: '',
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      report: {
        id: '',
        period: { end: '', start: '' },
        release: '5.1',
      },
    },
    id: '',
    insert: {
      index: '',
    },
  });

  test('should return null if file is not from remote', () => {
    const options = getOptions();

    const result = reharvestOrMarkAsError(
      { cache: { source: 'archive' }, path: '' },
      options,
      new Error('Error')
    );

    expect(result).toBe(null);
  });

  test('should set forceDownload if file is not from remote', () => {
    const options = getOptions();

    reharvestOrMarkAsError(
      { cache: { source: 'archive' }, path: '' },
      options,
      new Error('Error')
    );

    expect(options).toHaveProperty('download.forceDownload', true);
  });

  test('should set forceDownload if file is not from remote', () => {
    const options = getOptions();

    reharvestOrMarkAsError(
      { cache: { source: 'archive' }, path: '' },
      options,
      new Error('Error')
    );

    expect(options).toHaveProperty('download.forceDownload', true);
  });

  test('should return that harvest failed if from remote', () => {
    const options = getOptions();

    const result = reharvestOrMarkAsError(
      { cache: { httpCode: 500, source: 'remote' }, path: '' },
      options,
      new Error('Error')
    );

    expect(result).toHaveProperty('success', false);
  });

  test('should notify that harvest failed if from remote', () => {
    const options = getOptions();

    reharvestOrMarkAsError(
      { cache: { httpCode: 500, source: 'remote' }, path: '' },
      options,
      new Error('Error')
    );

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      error: {
        code: 'app:ERROR',
        message: 'Error',
      },
      id: options.id,
      status: 'error',
    });
  });
});
