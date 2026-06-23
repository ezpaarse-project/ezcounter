import { describe, expect, it, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

import { handleExceptions, reharvestOrMarkAsError } from '.';

vi.mock(import('~/queues/harvest/jobs/status'));
vi.mock(import('./steps/extract'));

describe('handle report exceptions', () => {
  it('should return null if no exceptions', () => {
    expect.hasAssertions();
    const result = handleExceptions([]);

    expect(result).toBeNull();
  });

  it('should return null if no error exceptions', () => {
    expect.hasAssertions();
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

    expect(result).toBeNull();
  });

  it('should return processing if report is processing', () => {
    expect.hasAssertions();
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

  it('should return unavailable if data host is unavailable', () => {
    expect.hasAssertions();
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

  it('should throw last HarvestError if error exception', () => {
    expect.hasAssertions();
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

describe('re-harvest or return error', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getOptions = (): HarvestJobData => ({
    download: {
      cacheKey: '',
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5.1',
      report: {
        id: '',
        period: { end: '', start: '' },
      },
    },
    id: '',
    insert: {
      index: '',
    },
  });

  it('should return null if file is not from remote', () => {
    expect.hasAssertions();
    const options = getOptions();

    const result = reharvestOrMarkAsError(
      { cache: { source: 'archive' }, path: '' },
      options,
      new Error('Error')
    );

    expect(result).toBeNull();
  });

  it('should set forceDownload if file is not from remote', () => {
    expect.hasAssertions();
    const options = getOptions();

    reharvestOrMarkAsError(
      { cache: { source: 'archive' }, path: '' },
      options,
      new Error('Error')
    );

    expect(options).toHaveProperty('download.forceDownload', true);
  });

  it('should return that harvest failed if from remote', () => {
    expect.hasAssertions();
    const options = getOptions();

    const result = reharvestOrMarkAsError(
      { cache: { httpCode: 500, source: 'remote' }, path: '' },
      options,
      new Error('Error')
    );

    expect(result).toHaveProperty('success', false);
  });

  it('should notify that harvest failed if from remote', () => {
    expect.hasAssertions();
    const options = getOptions();

    reharvestOrMarkAsError(
      { cache: { httpCode: 500, source: 'remote' }, path: '' },
      options,
      new Error('Error')
    );

    expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
      error: {
        code: 'app:ERROR',
        message: 'Error',
      },
      id: options.id,
      status: 'error',
    });
  });
});
