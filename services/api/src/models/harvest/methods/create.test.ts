import { describe, expect, test } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { dbClient } from '~/lib/__mocks__/prisma';

import { createManyHarvestJob } from './create';

describe(createManyHarvestJob, () => {
  test('should query DB', async () => {
    await createManyHarvestJob([]);

    expect(dbClient.harvestJob.createMany).toBeCalled();
  });

  test('should transform input', async () => {
    const item: HarvestJobData = {
      download: {
        cacheKey: 'download.cacheKey',
        dataHost: {
          auth: {},
          baseUrl: 'download.dataHost.baseUrl',
          paramsSeparator: 'download.dataHost.paramsSeparator',
          periodFormat: 'download.dataHost.periodFormat',
        },
        forceDownload: true,
        report: {
          id: 'download.report.id',
          params: {
            access_method: ['download.report.params.access_method.0'],
            foo: 'download.dataHost.additionalParams.foo',
          },
          period: {
            end: 'download.report.period.end',
            start: 'download.report.period.start',
          },
          release: '5.1',
        },
        timeout: 10,
      },
      id: 'id',
      insert: {
        index: 'insert.index',
      },
    };

    await createManyHarvestJob([item]);

    expect(dbClient.harvestJob.createMany).toBeCalledWith({
      data: [
        {
          dataHostId: 'download.cacheKey',
          forceDownload: true,
          id: 'id',
          index: 'insert.index',
          params: {
            access_method: ['download.report.params.access_method.0'],
            foo: 'download.dataHost.additionalParams.foo',
          },
          period: {
            end: 'download.report.period.end',
            start: 'download.report.period.start',
          },
          release: '5.1',
          reportId: 'download.report.id',
          status: 'pending',
        },
      ],
    });
  });
});
