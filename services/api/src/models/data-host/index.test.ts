import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from './dto';
import { getDataHostWithSupportedData } from './index';

describe(getDataHostWithSupportedData, () => {
  const dataHost: DataHost = {
    createdAt: new Date(),
    id: '',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM-dd',
    updatedAt: null,
  };
  const release: DataHostSupportedRelease = {
    baseUrl: 'https://counter-datahost.com/',
    createdAt: new Date(),
    dataHostId: '',
    params: {},
    refreshedAt: null,
    release: '5.1',
    updatedAt: null,
  };
  const report: DataHostSupportedReport = {
    createdAt: new Date(),
    dataHostId: '',
    firstMonthAvailable: '',
    firstMonthAvailableOverride: null,
    id: 'tr',
    lastMonthAvailable: '',
    lastMonthAvailableOverride: null,
    params: {},
    release: '5.1',
    supported: false,
    supportedOverride: null,
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
