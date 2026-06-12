import { describe, expect, test, vi } from 'vitest';

import type { HarvestRequestContent } from '@ezcounter/dto/queues';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';

import { getDataHostWithSupportedData } from '../data-host/__mocks__';
import { resolveRequestContextPerHostname } from './context';

vi.mock(import('~/models/data-host'));

describe('Resolve context of Harvest Request', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getRequest = (): HarvestRequestContent => ({
    download: {
      dataHost: {
        auth: { customer_id: 'foobar' },
        id: 'my-counter-datahost',
      },

      release: '5.1',
      reports: [
        {
          id: 'ir',
          period: { end: '2025-12', start: '2025-01' },
        },
      ],
    },
    insert: {
      index: 'z-example-counter51',
    },
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getDataHost = (): DataHostWithSupportedData => ({
    createdAt: new Date(),
    id: 'my-counter-datahost',
    params: {},
    supportedReleases: [
      {
        baseUrl: 'https://my-counter.datahost.com/r51',
        createdAt: new Date(),
        dataHostId: 'my-counter-datahost',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        release: '5.1',
        supportedReports: [],
        updatedAt: null,
      },
    ],
    updatedAt: null,
  });

  test('should get data host with supported data', async () => {
    const request = getRequest();

    await resolveRequestContextPerHostname([request]);

    expect(getDataHostWithSupportedData).toHaveBeenCalled();
  });

  test('should skip if host in unknown', async () => {
    const request = getRequest();

    getDataHostWithSupportedData.mockResolvedValueOnce(null);

    const result = await resolveRequestContextPerHostname([request]);

    expect(result.size).toBe(0);
  });

  test('should skip if cannot get host with supported data', async () => {
    const request = getRequest();

    getDataHostWithSupportedData.mockRejectedValueOnce(new Error('DB error'));

    const result = await resolveRequestContextPerHostname([request]);

    expect(result.size).toBe(0);
  });

  test('should skip if base URL is invalid', async () => {
    const request = getRequest();
    const dataHost = getDataHost();
    dataHost.supportedReleases[0].baseUrl = 'foobar';

    getDataHostWithSupportedData.mockResolvedValueOnce(dataHost);

    const result = await resolveRequestContextPerHostname([request]);

    // oxlint-disable-next-line unicorn/no-useless-undefined
    expect(result.get(undefined)).toHaveLength(1);
  });

  test('should skip if release is unsupported', async () => {
    const request = getRequest();
    request.download.release = '5';
    const dataHost = getDataHost();

    getDataHostWithSupportedData.mockResolvedValueOnce(dataHost);

    const result = await resolveRequestContextPerHostname([request]);

    expect(result.size).toBe(0);
  });

  test('should group requests by hostname', async () => {
    const request1 = getRequest();
    request1.download.dataHost.id = 'my-counter-datahost1';
    const request2 = getRequest();
    request2.download.dataHost.id = 'my-counter-datahost2';
    const request3 = getRequest();
    request3.download.dataHost.id = 'my-counter-datahost3';

    const dataHost1 = getDataHost();
    dataHost1.id = 'my-counter-datahost1';
    const dataHost2 = getDataHost();
    dataHost2.id = 'my-counter-datahost2';
    const dataHost3 = getDataHost();
    dataHost3.id = 'my-counter-datahost3';
    dataHost3.supportedReleases[0].baseUrl =
      'https://my-other.datahost.com/r51';

    getDataHostWithSupportedData.mockResolvedValueOnce(dataHost1);
    getDataHostWithSupportedData.mockResolvedValueOnce(dataHost2);
    getDataHostWithSupportedData.mockResolvedValueOnce(dataHost3);

    const result = await resolveRequestContextPerHostname([
      request1,
      request2,
      request3,
    ]);

    expect(result.size).toBe(2);

    expect(result.get('my-counter.datahost.com')).toHaveLength(2);
    expect(result.get('my-counter.datahost.com')).toHaveProperty(
      '0.content',
      request1
    );

    expect(result.get('my-other.datahost.com')).toHaveProperty(
      '0.dataHost',
      dataHost3
    );
  });
});
