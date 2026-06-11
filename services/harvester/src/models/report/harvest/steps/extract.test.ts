import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import type {
  COUNTERReportHeader,
  COUNTERReportItem,
} from '~/models/report/dto';
import { IdleTimeoutController } from '~/models/idle-timeout';
import { extractReportExceptions } from '~/models/report/extraction/exceptions';
import {
  extractRegistryId,
  extractReportHeader,
} from '~/models/report/extraction/header';
import { extractReportItems } from '~/models/report/extraction/items';

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/__mocks__/status';

import {
  getReportExceptions,
  getReportHeader,
  queueReportItems,
} from './extract';

vi.mock(import('~/queues/harvest/jobs/status'));
vi.mock(import('~/queues/enrich/jobs'));
vi.mock(import('~/models/report/extraction/exceptions'));
vi.mock(import('~/models/report/extraction/header'));
vi.mock(import('~/models/report/extraction/items'));

const OPTIONS: HarvestJobData = {
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
};

describe('Report Exceptions (getReportExceptions)', () => {
  test('should extract exceptions from report', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    await getReportExceptions({ path: '' }, OPTIONS);

    expect(extractReportExceptions).toHaveBeenCalled();
  });

  test('should treat HTTP status as exception', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const result = await getReportExceptions(
      { httpCode: 418, path: '' },
      OPTIONS
    );

    expect(result).toHaveProperty('0.code', 'http:418');
  });

  test('should not throw on error', async () => {
    vi.mocked(extractReportExceptions).mockRejectedValueOnce(
      new Error('Something happened')
    );

    const promise = getReportExceptions({ path: '' }, OPTIONS);

    await expect(promise).resolves.not.toThrow();
  });

  test('should throw on abort', async () => {
    const timeout = new IdleTimeoutController();
    timeout.abort();

    vi.mocked(extractReportExceptions).mockImplementationOnce(() => {
      timeout.signal.throwIfAborted();
      return Promise.resolve([]);
    });

    const promise = getReportExceptions({ path: '' }, OPTIONS, timeout);

    await expect(promise).rejects.toThrow('This operation was aborted');
  });

  test('should tick timeout', async () => {
    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toHaveBeenCalled();
  });

  test('should notify progress', async () => {
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const res = await getReportExceptions({ path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
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

    expect(extractReportHeader).toHaveBeenCalled();
  });

  test('should extract registryId', async () => {
    await getReportHeader('', OPTIONS);

    expect(extractRegistryId).toHaveBeenCalled();
  });

  test('should throw on error', async () => {
    vi.mocked(extractReportHeader).mockRejectedValueOnce(
      new Error('Something happened')
    );

    const promise = getReportHeader('', OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  test('should tick timeout', async () => {
    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toHaveBeenCalled();
  });

  test('should notify progress', async () => {
    vi.mocked(extractRegistryId).mockReturnValueOnce(null);

    await getReportHeader('', OPTIONS);

    expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
      extract: {
        header: true,
        registryId: null,
        status: 'processing',
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

    expect(extractReportItems).toHaveBeenCalled();
  });

  test('should throw on error', async () => {
    vi.mocked(extractReportItems).mockImplementationOnce(() => {
      throw new Error('Something happened');
    });

    const promise = queueReportItems({ date: '', header, path: '' }, OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  test('should tick timeout', async () => {
    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ date: '', header, path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toHaveBeenCalled();
  });

  test('should tick timeout after every item', async () => {
    vi.mocked(extractReportItems).mockImplementationOnce(
      async function* dummy() {
        for (let index = 0; index < 5000; index += 1) {
          yield { item: mockDeep<COUNTERReportItem>() };
        }
      }
    );

    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ date: '', header, path: '' }, OPTIONS, timeout);

    // Should tick after extracting then after every item
    expect(timeout.tick).toHaveBeenCalledTimes(5000 + 1);
  });

  test('should notify progress', async () => {
    await queueReportItems({ date: '', header, path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).toHaveBeenCalledWith({
      extract: {
        items: 0,
        status: 'processing',
      },
      id: OPTIONS.id,
      status: 'processing',
    });
  });

  test('should notify progress after time', async () => {
    vi.mocked(extractReportItems).mockImplementationOnce(
      async function* dummy() {
        for (let index = 0; index < 5000; index += 1) {
          yield { item: mockDeep<COUNTERReportItem>() };
        }
      }
    );

    const promise = queueReportItems({ date: '', header, path: '' }, OPTIONS);

    expect(sendHarvestJobStatusEvent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(900);
    expect(sendHarvestJobStatusEvent).toHaveBeenCalledTimes(3);
    await promise;
  });
});
