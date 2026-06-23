import { describe, expect, it, vi } from 'vitest';
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

import { sendHarvestJobStatusEvent } from '~/queues/harvest/jobs/status';

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

describe('get report exceptions', () => {
  it('should extract exceptions from report', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    await getReportExceptions({ path: '' }, OPTIONS);

    expect(extractReportExceptions).toHaveBeenCalledOnce();
  });

  it('should treat HTTP status as exception', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    const result = await getReportExceptions(
      { httpCode: 418, path: '' },
      OPTIONS
    );

    expect(result).toHaveProperty('0.code', 'http:418');
  });

  it('should not throw on error', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportExceptions).mockRejectedValueOnce(
      new Error('Something happened')
    );

    const promise = getReportExceptions({ path: '' }, OPTIONS);

    await expect(promise).resolves.not.toThrow();
  });

  it('should throw on abort', async () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();
    timeout.abort();

    vi.mocked(extractReportExceptions).mockImplementationOnce(() => {
      timeout.signal.throwIfAborted();
      return Promise.resolve([]);
    });

    const promise = getReportExceptions({ path: '' }, OPTIONS, timeout);

    await expect(promise).rejects.toThrow('This operation was aborted');
  });

  it('should tick timeout', async () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    vi.mocked(extractReportExceptions).mockResolvedValueOnce([]);

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toHaveBeenCalledOnce();
  });

  it('should notify progress', async () => {
    expect.hasAssertions();
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

describe('get report header', () => {
  it('should extract header', async () => {
    expect.hasAssertions();
    await getReportHeader('', OPTIONS);

    expect(extractReportHeader).toHaveBeenCalledOnce();
  });

  it('should extract registryId', async () => {
    expect.hasAssertions();
    await getReportHeader('', OPTIONS);

    expect(extractRegistryId).toHaveBeenCalledOnce();
  });

  it('should throw on error', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportHeader).mockRejectedValueOnce(
      new Error('Something happened')
    );

    const promise = getReportHeader('', OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  it('should tick timeout', async () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await getReportExceptions({ path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toHaveBeenCalledOnce();
  });

  it('should notify progress', async () => {
    expect.hasAssertions();
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

describe('get report items', () => {
  const header = mockDeep<COUNTERReportHeader>();

  it('should extract items', async () => {
    expect.hasAssertions();
    await queueReportItems({ date: '', header, path: '' }, OPTIONS);

    expect(extractReportItems).toHaveBeenCalledOnce();
  });

  it('should throw on error', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportItems).mockImplementationOnce(() => {
      throw new Error('Something happened');
    });

    const promise = queueReportItems({ date: '', header, path: '' }, OPTIONS);

    await expect(promise).rejects.toThrow('Something happened');
  });

  it('should tick timeout', async () => {
    expect.hasAssertions();
    const timeout = new IdleTimeoutController();
    timeout.tick = vi.spyOn(timeout, 'tick');

    await queueReportItems({ date: '', header, path: '' }, OPTIONS, timeout);

    expect(timeout.tick).toHaveBeenCalledOnce();
  });

  it('should tick timeout after every item', async () => {
    expect.hasAssertions();
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

  it('should notify progress', async () => {
    expect.hasAssertions();
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

  it('should notify progress after time', async () => {
    expect.hasAssertions();
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
