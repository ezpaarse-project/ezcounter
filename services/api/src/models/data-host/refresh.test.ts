import { describe, expect, test } from 'vitest';

import { fetchReportList } from '@ezcounter/counter/__mocks__';

import { dbClient } from '~/lib/__mocks__/prisma';

import type { DataHostWithSupportedData } from './dto';
import { refreshSupportedReportsOfDataHost } from './refresh';

describe('Refresh supported reports (refreshSupportedReportsOfDataHost)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getDataHost = (): DataHostWithSupportedData => ({
    createdAt: new Date(),
    id: '',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM-dd',
    supportedReleases: [
      {
        baseUrl: 'https://counter-datahost.com/',
        createdAt: new Date(),
        dataHostId: '',
        params: {},
        refreshedAt: null,
        release: '5.1',
        supportedReports: [
          {
            createdAt: new Date(),
            dataHostId: '',
            firstMonthAvailable: '',
            firstMonthAvailableOverride: null,
            id: 'tr',
            lastMonthAvailable: '',
            lastMonthAvailableOverride: null,
            params: {},
            release: '5.1',
            supported: true,
            supportedOverride: null,
            updatedAt: null,
          },
        ],
        updatedAt: null,
      },
    ],
    updatedAt: null,
  });

  describe('No options', () => {
    test('should request data host', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(fetchReportList).toBeCalled();
    });

    test('should update or create reports in db', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(dbClient.dataHostSupportedReport.upsert).toBeCalled();
    });

    test('should update release in db', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(dbClient.dataHostSupportedRelease.update).toBeCalled();
    });

    test('should mark missing standard reports as unsupported', async () => {
      fetchReportList.mockResolvedValueOnce([]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'ir');
      expect(report).toHaveProperty('supported', false);
    });

    test('should mark missing existing reports as unsupported', async () => {
      fetchReportList.mockResolvedValueOnce([]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', false);
    });

    test('should mark present reports as supported', async () => {
      fetchReportList.mockResolvedValueOnce([
        {
          First_Month_Available: '2025-01',
          Last_Month_Available: '2025-12',
          Release: '5.1',
          Report_Description: '',
          Report_ID: 'TR',
          Report_Name: 'Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', true);
    });

    test('should update months available', async () => {
      fetchReportList.mockResolvedValueOnce([
        {
          First_Month_Available: '2024-01',
          Last_Month_Available: '2025-12',
          Release: '5.1',
          Report_Description: '',
          Report_ID: 'TR',
          Report_Name: 'Title Report',
        },
      ]);

      const dataHost = getDataHost();
      dataHost.supportedReleases[0].supportedReports[0].firstMonthAvailable =
        '2025-01';
      dataHost.supportedReleases[0].supportedReports[0].lastMonthAvailable =
        '2025-05';

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('firstMonthAvailable', '2024-01');
      expect(report).toHaveProperty('lastMonthAvailable', '2025-12');
    });

    test('should update months available with non standard format', async () => {
      fetchReportList.mockResolvedValueOnce([
        {
          First_Month_Available: '2025-01-01',
          Last_Month_Available: '2025-12-31',
          Release: '5.1',
          Report_Description: '',
          Report_ID: 'TR',
          Report_Name: 'Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('firstMonthAvailable', '2025-01');
      expect(report).toHaveProperty('lastMonthAvailable', '2025-12');
    });

    test('should NOT update months available with unusable format', async () => {
      fetchReportList.mockResolvedValueOnce([
        {
          First_Month_Available: 'foo',
          Last_Month_Available: 'bar',
          Release: '5.1',
          Report_Description: '',
          Report_ID: 'TR',
          Report_Name: 'Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('firstMonthAvailable', '');
      expect(report).toHaveProperty('lastMonthAvailable', '');
    });

    test('should mark custom reports as supported', async () => {
      fetchReportList.mockResolvedValueOnce([
        {
          Release: '5.1',
          Report_Description: '',
          Report_ID: 'CUSTOM:TR',
          Report_Name: 'Custom Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'custom:tr');
      expect(report).toHaveProperty('supported', true);
    });

    test('should skip reports with wrong Release', async () => {
      fetchReportList.mockResolvedValueOnce([
        {
          Release: '5',
          Report_Description: '',
          Report_ID: 'TR',
          Report_Name: 'Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', false);
    });

    test('should NOT update user values', async () => {
      fetchReportList.mockResolvedValueOnce([]);

      const dataHost = getDataHost();
      dataHost.supportedReleases[0].supportedReports[0].supportedOverride = true;

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supportedOverride', true);
    });

    test('should NOT refresh if too recent', async () => {
      const dataHost = getDataHost();
      dataHost.supportedReleases[0].refreshedAt = new Date();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(fetchReportList).not.toBeCalled();
    });

    test('should NOT update existing reports if NOT refresh', async () => {
      const dataHost = getDataHost();
      dataHost.supportedReleases[0].refreshedAt = new Date();

      const result = await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', true);
    });

    test('should throw if unsupported release', async () => {
      const dataHost = getDataHost();

      const promise = refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5' }
      );

      await expect(promise).rejects.toThrow(
        'Release 5 is not supported by data host'
      );
    });

    test('should throw if fetch failed', async () => {
      fetchReportList.mockRejectedValueOnce(new Error('fetch failed'));

      const dataHost = getDataHost();

      const promise = refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { release: '5.1' }
      );

      await expect(promise).rejects.toThrow('fetch failed');
    });
  });

  describe('Force refresh', () => {
    test('should request data host', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(fetchReportList).toBeCalled();
    });

    test('should update or create reports in db', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(dbClient.dataHostSupportedReport.upsert).toBeCalled();
    });

    test('should update release in db', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(dataHost, {}, { release: '5.1' });

      expect(dbClient.dataHostSupportedRelease.update).toBeCalled();
    });

    test('should refresh even if too recent', async () => {
      fetchReportList.mockResolvedValueOnce([]);

      const dataHost = getDataHost();
      dataHost.supportedReleases[0].refreshedAt = new Date();

      await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { forceRefresh: true, release: '5.1' }
      );

      expect(fetchReportList).toBeCalled();
    });
  });

  describe('Dry run', () => {
    test('should request data host', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { dryRun: true, release: '5.1' }
      );

      expect(fetchReportList).toBeCalled();
    });

    test('should NOT update or create reports in db', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { dryRun: true, release: '5.1' }
      );

      expect(dbClient.dataHostSupportedReport.upsert).not.toBeCalled();
    });

    test('should NOT update release in db', async () => {
      const dataHost = getDataHost();

      await refreshSupportedReportsOfDataHost(
        dataHost,
        {},
        { dryRun: true, release: '5.1' }
      );

      expect(dbClient.dataHostSupportedRelease.update).not.toBeCalled();
    });
  });
});
