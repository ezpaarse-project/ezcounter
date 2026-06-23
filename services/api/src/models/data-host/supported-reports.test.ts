import { describe, expect, it, vi } from 'vitest';

import { fetchReportList } from '@ezcounter/counter';

import type { DataHostWithSupportedData } from './dto';
import { fetchSupportedReportsOfDataHost } from './supported-reports';

describe('refresh supported reports', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getDataHost = (): DataHostWithSupportedData => ({
    createdAt: new Date(),
    id: '',
    params: {},
    supportedReleases: [
      {
        baseUrl: 'https://counter-datahost.com/',
        createdAt: new Date(),
        dataHostId: '',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        release: '5.1',
        supportedReports: [
          {
            createdAt: new Date(),
            dataHostId: '',
            firstMonthAvailable: '',
            id: 'pr',
            lastMonthAvailable: '',
            params: {},
            release: '5.1',
            supported: true,
            updatedAt: null,
          },
          {
            createdAt: new Date(),
            dataHostId: '',
            firstMonthAvailable: null,
            id: 'tr',
            lastMonthAvailable: null,
            params: {},
            release: '5.1',
            supported: null,
            updatedAt: null,
          },
        ],
        updatedAt: null,
      },
    ],
    updatedAt: null,
  });

  describe('no options', () => {
    it('should request data host', async () => {
      expect.hasAssertions();
      const dataHost = getDataHost();

      await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      expect(fetchReportList).toHaveBeenCalledOnce();
    });

    it('should mark missing standard reports as unsupported', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([]);

      const dataHost = getDataHost();

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'ir');
      expect(report).toHaveProperty('supported', false);
    });

    it('should mark missing existing reports as unsupported (if not override)', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([]);

      const dataHost = getDataHost();

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', false);
    });

    it('should mark present reports as supported', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([
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

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', true);
    });

    it('should update months available', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([
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

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('firstMonthAvailable', '2024-01');
      expect(report).toHaveProperty('lastMonthAvailable', '2025-12');
    });

    it('should update months available with non standard format', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([
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

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('firstMonthAvailable', '2025-01');
      expect(report).toHaveProperty('lastMonthAvailable', '2025-12');
    });

    it('should NOT update months available with unusable format', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([
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

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('firstMonthAvailable', '');
      expect(report).toHaveProperty('lastMonthAvailable', '');
    });

    it('should mark custom reports as supported', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([
        {
          Release: '5.1',
          Report_Description: '',
          Report_ID: 'CUSTOM:TR',
          Report_Name: 'Custom Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'custom:tr');
      expect(report).toHaveProperty('supported', true);
    });

    it('should skip reports with wrong Release', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([
        {
          Release: '5',
          Report_Description: '',
          Report_ID: 'TR',
          Report_Name: 'Title Report',
        },
      ]);

      const dataHost = getDataHost();

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'tr');
      expect(report).toHaveProperty('supported', false);
    });

    it('should NOT update user values', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockResolvedValueOnce([]);

      const dataHost = getDataHost();

      const result = await fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      const report = result.find((item) => item.id === 'pr');
      expect(report).toHaveProperty('supported', true);
    });

    it('should throw if unsupported release', async () => {
      expect.hasAssertions();
      const dataHost = getDataHost();

      const promise = fetchSupportedReportsOfDataHost(dataHost, {}, '5');

      await expect(promise).rejects.toThrow(
        'Release 5 is not supported by data host'
      );
    });

    it('should throw if fetch failed', async () => {
      expect.hasAssertions();
      vi.mocked(fetchReportList).mockRejectedValueOnce(
        new Error('fetch failed')
      );

      const dataHost = getDataHost();

      const promise = fetchSupportedReportsOfDataHost(dataHost, {}, '5.1');

      await expect(promise).rejects.toThrow('fetch failed');
    });
  });
});
