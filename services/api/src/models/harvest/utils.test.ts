import { describe, expect, test, vi } from 'vitest';

import type {
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from '~/models/data-host/types';
import type { HarvestRequest } from '~/models/harvest/types';
import { getDataHostWithSupportedData } from '~/models/data-host/__mocks__';
import { prepareHarvestJobs } from '~/models/harvest/utils';

vi.mock(import('~/models/data-host'));

describe('Prepare harvest jobs per request (prepareHarvestJobs)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getRequest = (): HarvestRequest => ({
    download: {
      reports: [
        {
          id: 'ir',
          period: { start: '2025-01', end: '2025-12' },
          release: '5.1',
        },
      ],

      dataHost: {
        id: 'my-counter-datahost',
        auth: { customer_id: 'foobar' },
      },
    },
    insert: {
      index: 'z-example-counter51',
    },
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getDataHost = (
    supportedReports: DataHostSupportedReport[] = []
  ): DataHostWithSupportedData => ({
    id: 'my-counter-datahost',
    periodFormat: 'yyyy-MM-dd',
    paramsSeparator: '|',
    params: {},
    createdAt: new Date(),
    updatedAt: null,
    supportedReleases: [
      {
        dataHostId: 'my-counter-datahost',
        release: '5.1',
        baseUrl: '',
        createdAt: new Date(),
        updatedAt: null,
        supportedReports,
      },
    ],
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getSupportedReport = (): DataHostSupportedReport => ({
    dataHostId: '',
    release: '5.1',
    id: 'ir',
    supported: true,
    supportedOverride: null,
    firstMonthAvailable: '',
    firstMonthAvailableOverride: null,
    lastMonthAvailable: '',
    lastMonthAvailableOverride: null,
    createdAt: new Date(),
    updatedAt: null,
  });

  test('should return array of jobs', async () => {
    getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

    const request = getRequest();

    const promise = prepareHarvestJobs(request);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });

  test('should throw if data host is unknown', async () => {
    const request = getRequest();

    const promise = prepareHarvestJobs(request);

    await expect(promise).rejects.toThrow(
      'Data host my-counter-datahost is not registered'
    );
  });

  describe('Split period by months (splitPeriodByMonths)', () => {
    test('should split by equal parts if possible', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();
      request.download.reports[0].splitPeriodBy = 6;

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(2);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-01');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-06');

      expect(jobs).toHaveProperty('1.download.report.period.start', '2025-07');
      expect(jobs).toHaveProperty('1.download.report.period.end', '2025-12');
    });

    test('should split with last part smaller if equal parts are not possible', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();
      request.download.reports[0].splitPeriodBy = 5;

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(3);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-01');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-05');

      expect(jobs).toHaveProperty('1.download.report.period.start', '2025-06');
      expect(jobs).toHaveProperty('1.download.report.period.end', '2025-10');

      expect(jobs).toHaveProperty('2.download.report.period.start', '2025-11');
      expect(jobs).toHaveProperty('2.download.report.period.end', '2025-12');
    });

    test('should be able to split by periods of 1 month', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();
      request.download.reports[0].splitPeriodBy = 1;

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(12);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-01');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-01');

      expect(jobs).toHaveProperty('6.download.report.period.start', '2025-07');
      expect(jobs).toHaveProperty('6.download.report.period.end', '2025-07');
    });

    test('should return the period if not split', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(1);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-01');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-12');
    });

    test('should throw if number of months is less than 0', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();
      request.download.reports[0].splitPeriodBy = -1;

      const promise = prepareHarvestJobs(request);

      await expect(promise).rejects.toThrow('monthsPerPart must be at least 0');
    });
  });

  describe('Limit report with supported (limitHarvestWithSupported)', () => {
    test('should change nothing if request is supported', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs[0]).toMatchObject({
        download: {
          cacheKey: 'my-counter-datahost',
          dataHost: {
            additionalParams: {},
            auth: {
              customer_id: 'foobar',
            },
            baseUrl: '',
            paramsSeparator: '|',
            periodFormat: 'yyyy-MM-dd',
          },
          report: {
            id: 'ir',
            period: {
              end: '2025-12',
              start: '2025-01',
            },
            release: '5.1',
          },
        },
        insert: {
          index: 'z-example-counter51',
        },
      });
    });

    test('should skip request if release is not supported', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();
      request.download.reports[0].release = '5';

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(0);
    });

    test('should change nothing if report is unknown', async () => {
      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost());

      const request = getRequest();
      request.download.reports[0].id = 'custom:tr';

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(1);
    });

    test('should skip request if report is unsupported', async () => {
      const report = getSupportedReport();
      report.supported = false;

      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost([report]));

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(0);
    });

    test('should skip request if report is supported, but overrode', async () => {
      const report = getSupportedReport();
      report.supported = true;
      report.supportedOverride = false;

      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost([report]));

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(0);
    });

    test('should NOT skip request if report is unsupported, but overrode', async () => {
      const report = getSupportedReport();
      report.supported = false;
      report.supportedOverride = true;

      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost([report]));

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveLength(1);
    });

    test("should change period if there's no limits", async () => {
      const report = getSupportedReport();
      report.firstMonthAvailable = '2025-03';
      report.lastMonthAvailable = '2025-09';

      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost([report]));

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-03');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-09');
    });

    test("should change period if there's no limits, but overrode", async () => {
      const report = getSupportedReport();
      report.firstMonthAvailableOverride = '2025-03';
      report.lastMonthAvailableOverride = '2025-09';

      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost([report]));

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-03');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-09');
    });

    test("should NOT change period if there's limits, but overrode", async () => {
      const report = getSupportedReport();
      report.firstMonthAvailable = '2025-03';
      report.lastMonthAvailable = '2025-09';
      report.firstMonthAvailableOverride = '';
      report.lastMonthAvailableOverride = '';

      getDataHostWithSupportedData.mockResolvedValueOnce(getDataHost([report]));

      const request = getRequest();

      const jobs = await prepareHarvestJobs(request);

      expect(jobs).toHaveProperty('0.download.report.period.start', '2025-01');
      expect(jobs).toHaveProperty('0.download.report.period.end', '2025-12');
    });
  });
});
