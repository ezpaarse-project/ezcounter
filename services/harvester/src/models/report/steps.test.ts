import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { HarvestJobData } from '@ezcounter/models/queues';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/__mocks__/status';

import type { RawReportHeader } from './types';
import { HarvestIdleTimeout } from '../timeout';
import {
  cacheReportToFile,
  getReportExceptions,
  getReportHeader,
  queueReportItems,
  archiveReportToFile,
} from './steps';
import { archiveReport } from './steps/__mocks__/archive';
import { cacheReport } from './steps/__mocks__/download';
import { extractReportExceptions } from './steps/extract/__mocks__/exceptions';
import {
  extractRegistryId,
  extractReportHeader,
} from './steps/extract/__mocks__/header';
import { extractReportItems } from './steps/extract/items/__mocks__';

vi.mock(import('~/queues/harvest/jobs/status'));
vi.mock(import('~/queues/enrich'));
vi.mock(import('./steps/download'));
vi.mock(import('./steps/extract/exceptions'));
vi.mock(import('./steps/extract/header'));
vi.mock(import('./steps/extract/items'));
vi.mock(import('./steps/archive'));

const OPTIONS: HarvestJobData = {
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
};

beforeEach(() => {
  // Clear function history
  vi.clearAllMocks();
});

describe('Cache report (cacheReportToFile)', () => {
  test('should cache report', async () => {
    cacheReport.mockResolvedValueOnce({
      source: 'remote',
      httpCode: 200,
    });

    await cacheReportToFile('', OPTIONS);

    expect(cacheReport).toBeCalled();
  });

  test('should throw on error', async () => {
    cacheReport.mockRejectedValueOnce(new Error('Something happened'));

    const promise = cacheReportToFile('', OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });
});

describe('Report Exceptions (getReportExceptions)', () => {
  test('should extract exceptions from report', async () => {
    extractReportExceptions.mockResolvedValue([]);

    await getReportExceptions({ path: '' }, OPTIONS);

    expect(extractReportExceptions).toBeCalled();
  });

  test('should treat HTTP status as exception', async () => {
    extractReportExceptions.mockResolvedValue([]);

    const result = await getReportExceptions(
      { path: '', httpCode: 418 },
      OPTIONS
    );

    expect(result).toHaveProperty('0.code', 'http:418');
  });

  test('should not throw on error', async () => {
    extractReportExceptions.mockRejectedValueOnce(
      new Error('Something happened')
    );

    const promise = getReportExceptions({ path: '' }, OPTIONS);

    await expect(promise).resolves.not.toThrow();
  });

  test('should throw on abort', async () => {
    const timeout = new HarvestIdleTimeout();
    timeout.abort();

    extractReportExceptions.mockImplementationOnce(() => {
      timeout.signal.throwIfAborted();
      return Promise.resolve([]);
    });

    const promise = getReportExceptions({ path: '' }, OPTIONS, timeout);

    await expect(promise).rejects.toThrowError('This operation was aborted');
  });

  test('should tick timeout', async () => {
    const timeout = new HarvestIdleTimeout();
    timeout.tick = vi.spyOn(timeout, 'tick');

    extractReportExceptions.mockResolvedValue([]);

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toBeCalled();
  });

  test('should notify progress', async () => {
    extractReportExceptions.mockResolvedValue([]);

    const res = await getReportExceptions({ path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: OPTIONS.id,
      current: 'extract',
      status: 'processing',
      extract: {
        done: false,
        exceptions: res,
      },
    });
  });
});

describe('Report Header (getReportHeader)', () => {
  test('should extract header', async () => {
    await getReportHeader('', OPTIONS);

    expect(extractReportHeader).toBeCalled();
  });

  test('should extract registryId', async () => {
    await getReportHeader('', OPTIONS);

    expect(extractRegistryId).toBeCalled();
  });

  test('should throw on error', async () => {
    extractReportHeader.mockRejectedValueOnce(new Error('Something happened'));

    const promise = getReportHeader('', OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  test('should tick timeout', async () => {
    const timeout = new HarvestIdleTimeout();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toBeCalled();
  });

  test('should notify progress', async () => {
    extractRegistryId.mockReturnValueOnce(null);

    await getReportHeader('', OPTIONS);

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: OPTIONS.id,
      current: 'extract',
      status: 'processing',
      extract: {
        done: false,
        header: true,
        registryId: null,
      },
    });
  });
});

describe('Report Items (queueReportItems)', () => {
  const HEADER = {} as unknown as RawReportHeader;

  type Iterator = ReturnType<typeof extractReportItems>;

  test('should extract items', async () => {
    extractReportItems.mockReturnValueOnce([] as unknown as Iterator);

    await queueReportItems({ path: '', header: HEADER }, OPTIONS);

    expect(extractReportItems).toBeCalled();
  });

  test('should throw on error', async () => {
    extractReportItems.mockImplementation(() => {
      throw new Error('Something happened');
    });

    const promise = queueReportItems({ path: '', header: HEADER }, OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  test('should tick timeout', async () => {
    extractReportItems.mockReturnValueOnce([] as unknown as Iterator);

    const timeout = new HarvestIdleTimeout();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ path: '', header: HEADER }, OPTIONS, timeout);

    expect(timeout.tick).toBeCalled();
  });

  test('should tick timeout after every item', async () => {
    extractReportItems.mockReturnValueOnce(
      Array.from({ length: 5000 }, () => ({})) as unknown as Iterator
    );

    const timeout = new HarvestIdleTimeout();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ path: '', header: HEADER }, OPTIONS, timeout);

    // Should tick after extracting then after every item
    expect(timeout.tick).toBeCalledTimes(5000 + 1);
  });

  test('should notify progress', async () => {
    extractReportItems.mockReturnValueOnce([] as unknown as Iterator);

    await queueReportItems({ path: '', header: HEADER }, OPTIONS);

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      id: OPTIONS.id,
      current: 'extract',
      status: 'processing',
      extract: {
        done: false,
        items: 0,
      },
    });
  });

  test('should notify progress after number of items', async () => {
    extractReportItems.mockReturnValueOnce(
      Array.from({ length: 5000 }, () => ({})) as unknown as Iterator
    );

    await queueReportItems({ path: '', header: HEADER }, OPTIONS);

    // Should notify every 2000 items then one final time
    expect(sendHarvestJobStatusEvent).toBeCalledTimes(
      Math.floor(5000 / 2000) + 1
    );
  });
});

describe('(archiveReportToFile)', () => {
  test('should archive report', async () => {
    await archiveReportToFile('', OPTIONS);

    expect(archiveReport).toBeCalled();
  });

  test('should not throw on error', async () => {
    archiveReport.mockRejectedValueOnce(new Error('Something happened'));

    const promise = archiveReportToFile('', OPTIONS);

    await expect(promise).resolves.not.toThrow();
  });
});
