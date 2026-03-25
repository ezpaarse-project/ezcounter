import { describe, expect, test, vi } from 'vitest';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';
import type { HarvestAuthOptions } from '~/models/harvest/dto';

import { getDataHostWithSupportedData } from '../__mocks__';
import { refreshSupportedReportOfDataHost } from './__mocks__/one';
import { refreshManySupportedReports } from './many';

vi.mock(import('~/models/data-host'));
vi.mock(import('./one'));

describe('Refresh many data hosts (refreshManySupportedReports)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getHosts = (): { id: string; auth: HarvestAuthOptions }[] => [
    {
      id: 'myId',
      auth: {},
    },
  ];

  // oxlint-disable-next-line consistent-function-scoping
  const getDataHost = (): DataHostWithSupportedData => ({
    id: '',
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM-dd',
    params: {},
    createdAt: new Date(),
    updatedAt: null,
    supportedReleases: [
      {
        dataHostId: '',
        release: '5.1',
        baseUrl: 'https://counter-datahost.com/',
        params: {},
        createdAt: new Date(),
        updatedAt: null,
        refreshedAt: null,
        supportedReports: [
          {
            dataHostId: '',
            release: '5.1',
            id: 'tr',
            params: {},
            supported: true,
            supportedOverride: null,
            firstMonthAvailable: '',
            firstMonthAvailableOverride: null,
            lastMonthAvailable: '',
            lastMonthAvailableOverride: null,
            createdAt: new Date(),
            updatedAt: null,
          },
        ],
      },
    ],
  });

  test('should refresh supported data', async () => {
    refreshSupportedReportOfDataHost.mockResolvedValueOnce([]);
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

    await refreshManySupportedReports(getHosts(), {
      release: '5.1',
    });

    expect(refreshSupportedReportOfDataHost).toBeCalled();
  });

  test('should return map of supported data', async () => {
    refreshSupportedReportOfDataHost.mockResolvedValueOnce([]);
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

    const result = await refreshManySupportedReports(getHosts(), {
      release: '5.1',
    });

    expect(result.has('myId')).toBe(true);
  });

  test('should group by url', async () => {
    refreshSupportedReportOfDataHost.mockResolvedValueOnce([]);
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

    await refreshManySupportedReports([...getHosts(), ...getHosts()], {
      release: '5.1',
    });

    expect(refreshSupportedReportOfDataHost).toBeCalledTimes(1);
  });

  test('should group by url using params', async () => {
    const datahost2 = getDataHost();
    datahost2.params = { foo: 'bar' };

    refreshSupportedReportOfDataHost.mockResolvedValueOnce([]);
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    getDataHostWithSupportedData.mockResolvedValueOnce(datahost2);

    await refreshManySupportedReports(
      [...getHosts(), ...getHosts(), ...getHosts()],
      {
        release: '5.1',
      }
    );

    expect(refreshSupportedReportOfDataHost).toBeCalledTimes(2);
  });

  test('should return map of supported data even if grouped', async () => {
    const hosts1 = getHosts();
    hosts1[0].id = 'myFirstId';

    refreshSupportedReportOfDataHost.mockResolvedValueOnce([]);
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

    const result = await refreshManySupportedReports(
      [...hosts1, ...getHosts()],
      {
        release: '5.1',
      }
    );

    expect(result.has('myFirstId')).toBe(true);
    expect(result.has('myId')).toBe(true);
  });

  test('should skip on release not supported', async () => {
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

    await refreshManySupportedReports(getHosts(), {
      release: '5',
    });

    expect(refreshSupportedReportOfDataHost).not.toBeCalled();
  });

  test('should skip if host is unknown', async () => {
    getDataHostWithSupportedData.mockResolvedValueOnce(null);

    await refreshManySupportedReports(getHosts(), {
      release: '5.1',
    });

    expect(refreshSupportedReportOfDataHost).not.toBeCalled();
  });

  test('should throw on invalid url', async () => {
    const host = getDataHost();
    host.supportedReleases[0].baseUrl = 'foobar';

    refreshSupportedReportOfDataHost.mockResolvedValueOnce([]);
    getDataHostWithSupportedData.mockResolvedValueOnce(host);

    const promise = refreshManySupportedReports(getHosts(), {
      release: '5.1',
    });

    await expect(promise).rejects.toThrow('Invalid URL');
  });
});
