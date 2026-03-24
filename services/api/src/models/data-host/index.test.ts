import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from './dto';
import { getDataHostWithSupportedData } from './index';

describe('getDataHostWithSupportedData', () => {
  const dataHost: DataHost = {
    id: '',
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM-dd',
    params: {},
    createdAt: new Date(),
    updatedAt: null,
  };
  const release: DataHostSupportedRelease = {
    dataHostId: '',
    release: '5.1',
    baseUrl: 'https://counter-datahost.com/',
    params: {},
    createdAt: new Date(),
    updatedAt: null,
    refreshedAt: null,
  };
  const report: DataHostSupportedReport = {
    dataHostId: '',
    release: '5.1',
    id: 'tr',
    params: {},
    supported: false,
    supportedOverride: null,
    firstMonthAvailable: '',
    firstMonthAvailableOverride: null,
    lastMonthAvailable: '',
    lastMonthAvailableOverride: null,
    createdAt: new Date(),
    updatedAt: null,
  };

  test('should query DB', async () => {
    dbClient.dataHost.findUnique.mockResolvedValueOnce({
      ...dataHost,
      // @ts-expect-error - Supported release will be included
      supportedReleases: [
        {
          ...release,
          supportedReports: [report],
        },
      ],
    });

    await getDataHostWithSupportedData('');

    expect(dbClient.dataHost.findUnique).toBeCalled();
  });

  test('should return data', async () => {
    dbClient.dataHost.findUnique.mockResolvedValueOnce({
      ...dataHost,
      // @ts-expect-error - Supported release will be included
      supportedReleases: [
        {
          ...release,
          supportedReports: [report],
        },
      ],
    });

    const result = await getDataHostWithSupportedData('');

    expect(result).toHaveProperty('id', '');
    expect(result).toHaveProperty('supportedReleases.0.release', '5.1');
    expect(result).toHaveProperty(
      'supportedReleases.0.supportedReports.0.id',
      'tr'
    );
  });

  test('should return null if not found', async () => {
    dbClient.dataHost.findUnique.mockResolvedValueOnce(null);

    const promise = getDataHostWithSupportedData('');

    await expect(promise).resolves.toBe(null);
  });
});
