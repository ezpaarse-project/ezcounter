import { describe, expect, test, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

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
    updatedAt: null,
  };
  const release: DataHostSupportedRelease = {
    baseUrl: 'https://counter-datahost.com/',
    createdAt: new Date(),
    dataHostId: '',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM-dd',
    release: '5.1',
    updatedAt: null,
  };
  const report: DataHostSupportedReport = {
    createdAt: new Date(),
    dataHostId: '',
    firstMonthAvailable: '',
    id: 'tr',
    lastMonthAvailable: '',
    params: {},
    release: '5.1',
    supported: false,
    updatedAt: null,
  };

  test('should query DB', async () => {
    vi.mocked(dbClient.dataHost.findUnique).mockResolvedValueOnce({
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

    expect(dbClient.dataHost.findUnique).toHaveBeenCalled();
  });

  test('should return data', async () => {
    vi.mocked(dbClient.dataHost.findUnique).mockResolvedValueOnce({
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
    vi.mocked(dbClient.dataHost.findUnique).mockResolvedValueOnce(null);

    const promise = getDataHostWithSupportedData('');

    await expect(promise).resolves.toBe(null);
  });
});
