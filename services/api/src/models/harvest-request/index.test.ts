import { describe, expect, test, vi } from 'vitest';

import type { HarvestRequestContent } from '@ezcounter/dto/queues';

import type {
  DataHostSupportedRelease,
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from '~/models/data-host/dto';
import { fetchSupportedReportsOfDataHost } from '~/models/data-host/__mocks__/supported-reports';

import { limitReportOptionsWithSupported } from '../harvest/__mocks__/limits';
import { resolveRequestContextPerHostname } from './__mocks__/context';
import { prepareHarvestJobsFromHarvestRequest } from './index';

vi.mock(import('~/models/data-host/supported-reports'));
vi.mock(import('./context'));
vi.mock(import('~/models/harvest/limits'));

describe('Prepare harvest jobs per request (prepareHarvestJobsFromHarvestRequest)', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getContext = (): {
    content: HarvestRequestContent;
    dataHost: DataHostWithSupportedData;
    release: DataHostSupportedRelease;
  } => ({
    content: {
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
    },
    dataHost: {
      createdAt: new Date(),
      id: 'my-counter-datahost',
      params: {},
      supportedReleases: [],
      updatedAt: null,
    },
    release: {
      baseUrl: 'https://my-counter.datahost.com/r51',
      createdAt: new Date(),
      dataHostId: 'my-counter-datahost',
      params: {},
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM-dd',
      release: '5.1',
      updatedAt: null,
    },
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getSupportedReport = (): DataHostSupportedReport => ({
    createdAt: new Date(),
    dataHostId: '',
    firstMonthAvailable: '',
    id: 'ir',
    lastMonthAvailable: '',
    params: {},
    release: '5.1',
    supported: true,
    updatedAt: null,
  });

  test('should return array of jobs', async () => {
    const context = getContext();

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([['my-counter-datahost', [context]]])
    );

    const promise = prepareHarvestJobsFromHarvestRequest([context.content]);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });

  test('should fetch supported reports', async () => {
    const context = getContext();

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([['my-counter-datahost', [context]]])
    );

    await prepareHarvestJobsFromHarvestRequest([context.content]);

    expect(fetchSupportedReportsOfDataHost).toHaveBeenCalled();
  });

  test('should merge params', async () => {
    const context = getContext();
    context.content.download.reports[0].params = {
      param0: 'from request',
      platform: 'test',
    };

    const report = getSupportedReport();
    report.params = {
      param0: 'from report',
      param1: 'from report',
    };

    context.release.params = {
      param0: 'from release',
      param1: 'from release',
      param2: 'from release',
    };

    context.dataHost.params = {
      param0: 'from host',
      param1: 'from host',
      param2: 'from host',
      param3: 'from host',
    };

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([['my-counter-datahost', [context]]])
    );
    fetchSupportedReportsOfDataHost.mockResolvedValueOnce([report]);

    const result = await prepareHarvestJobsFromHarvestRequest([
      context.content,
    ]);

    expect(result).toHaveProperty('0.download.report.params.platform', 'test');
    // Check overrides
    expect(result).toHaveProperty(
      '0.download.report.params.param0',
      'from request'
    );
    expect(result).toHaveProperty(
      '0.download.report.params.param1',
      'from report'
    );
    expect(result).toHaveProperty(
      '0.download.report.params.param2',
      'from release'
    );
    expect(result).toHaveProperty(
      '0.download.report.params.param3',
      'from host'
    );
  });

  test('should give ID to jobs', async () => {
    const context = getContext();
    const report = getSupportedReport();

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([['my-counter-datahost', [context]]])
    );
    fetchSupportedReportsOfDataHost.mockResolvedValueOnce([report]);

    const promise = prepareHarvestJobsFromHarvestRequest([context.content]);

    await expect(promise).resolves.toHaveProperty('0.id');
  });

  test('should skip invalid hosts', async () => {
    const context = getContext();

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([[undefined, [context]]])
    );

    const promise = prepareHarvestJobsFromHarvestRequest([context.content]);

    await expect(promise).resolves.toHaveLength(0);
  });

  test('should split periods', async () => {
    const context = getContext();
    context.content.download.reports[0].splitPeriodBy = 6;
    const report = getSupportedReport();

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([['my-counter-datahost', [context]]])
    );
    fetchSupportedReportsOfDataHost.mockResolvedValueOnce([report]);

    const promise = prepareHarvestJobsFromHarvestRequest([context.content]);

    await expect(promise).resolves.toHaveLength(2);
  });

  test('should limit reports', async () => {
    const context = getContext();
    context.content.download.reports[0].splitPeriodBy = 6;
    const report = getSupportedReport();

    resolveRequestContextPerHostname.mockResolvedValueOnce(
      new Map([['my-counter-datahost', [context]]])
    );
    fetchSupportedReportsOfDataHost.mockResolvedValueOnce([report]);

    await prepareHarvestJobsFromHarvestRequest([context.content]);

    expect(limitReportOptionsWithSupported).toHaveBeenCalled();
  });
});
