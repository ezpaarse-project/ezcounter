import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/__mocks__/status';

import type { COUNTERReportHeader, COUNTERReportItem } from './dto';
import { HarvestIdleTimeout } from '../timeout';
import {
  archiveReportToFile,
  cacheReportToFile,
  getReportExceptions,
  getReportHeader,
  queueReportItems,
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
vi.mock(import('~/queues/enrich/jobs'));
vi.mock(import('./steps/download'));
vi.mock(import('./steps/extract/exceptions'));
vi.mock(import('./steps/extract/header'));
vi.mock(import('./steps/extract/items'));
vi.mock(import('./steps/archive'));

const OPTIONS: HarvestJobData = {
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
};

describe('Cache report (cacheReportToFile)', () => {
  test('should cache report', async () => {
    cacheReport.mockResolvedValueOnce({
      httpCode: 200,
      source: 'remote',
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
    extractReportExceptions.mockResolvedValueOnce([]);

    await getReportExceptions({ path: '' }, OPTIONS);

    expect(extractReportExceptions).toBeCalled();
  });

  test('should treat HTTP status as exception', async () => {
    extractReportExceptions.mockResolvedValueOnce([]);

    const result = await getReportExceptions(
      { httpCode: 418, path: '' },
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

    extractReportExceptions.mockResolvedValueOnce([]);

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toBeCalled();
  });

  test('should notify progress', async () => {
    extractReportExceptions.mockResolvedValueOnce([]);

    const res = await getReportExceptions({ path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      extract: {
        exceptions: res,
        status: 'processing',
      },
      id: OPTIONS.id,
      status: 'processing',
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
      extract: {
        header: true,
        registryId: null,
        status: 'pending',
      },
      id: OPTIONS.id,
      status: 'processing',
    });
  });
});

describe('Report Items (queueReportItems)', () => {
  const header = mockDeep<COUNTERReportHeader>();

  test('should extract items', async () => {
    await queueReportItems({ date: '', header, path: '' }, OPTIONS);

    expect(extractReportItems).toBeCalled();
  });

  test('should throw on error', async () => {
    extractReportItems.mockImplementationOnce(() => {
      throw new Error('Something happened');
    });

    const promise = queueReportItems({ date: '', header, path: '' }, OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  test('should tick timeout', async () => {
    const timeout = new HarvestIdleTimeout();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ date: '', header, path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toBeCalled();
  });

  test('should tick timeout after every item', async () => {
    extractReportItems.mockImplementationOnce(async function* dummy() {
      for (let index = 0; index < 5000; index += 1) {
        yield { item: mockDeep<COUNTERReportItem>() };
      }
    });

    const timeout = new HarvestIdleTimeout();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ date: '', header, path: '' }, OPTIONS, timeout);

    // Should tick after extracting then after every item
    expect(timeout.tick).toBeCalledTimes(5000 + 1);
  });

  test('should notify progress', async () => {
    await queueReportItems({ date: '', header, path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).toBeCalledWith({
      extract: {
        items: 0,
        status: 'pending',
      },
      id: OPTIONS.id,
      status: 'processing',
    });
  });

  test('should notify progress after time', async () => {
    extractReportItems.mockImplementationOnce(async function* dummy() {
      for (let index = 0; index < 5000; index += 1) {
        yield { item: mockDeep<COUNTERReportItem>() };
      }
    });

    const promise = queueReportItems({ date: '', header, path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).not.toBeCalled();
    vi.advanceTimersByTime(900);
    expect(sendHarvestJobStatusEvent).toBeCalledTimes(3);
    await promise;
  });
});

describe('Archive Report (archiveReportToFile)', () => {
  test('should archive report', async () => {
    await archiveReportToFile(
      { cache: { source: 'remote' }, path: '' },
      OPTIONS
    );

    expect(archiveReport).toBeCalled();
  });

  test('should not throw on error', async () => {
    archiveReport.mockRejectedValueOnce(new Error('Something happened'));

    const promise = archiveReportToFile(
      { cache: { source: 'remote' }, path: '' },
      OPTIONS
    );

    await expect(promise).resolves.not.toThrow();
  });
});
