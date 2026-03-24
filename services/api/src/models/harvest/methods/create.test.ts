import { describe, expect, test } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { dbClient } from '~/lib/__mocks__/prisma';

import { createManyHarvestJob } from './create';

describe('createManyHarvestJob', () => {
  test('should query DB', async () => {
    await createManyHarvestJob([]);

    expect(dbClient.harvestJob.createMany).toBeCalled();
  });

  test('should transform input', async () => {
    const item: HarvestJobData = {
      id: 'id',
      download: {
        cacheKey: 'download.cacheKey',
        report: {
          id: 'download.report.id',
          release: '5.1',
          period: {
            start: 'download.report.period.start',
            end: 'download.report.period.end',
          },
          params: {
            access_method: ['download.report.params.access_method.0'],
            foo: 'download.dataHost.additionalParams.foo',
          },
        },
        dataHost: {
          auth: {},
          baseUrl: 'download.dataHost.baseUrl',
          periodFormat: 'download.dataHost.periodFormat',
          paramsSeparator: 'download.dataHost.paramsSeparator',
        },
        forceDownload: true,
        timeout: 10,
      },
      insert: {
        index: 'insert.index',
      },
    };

    await createManyHarvestJob([item]);

    expect(dbClient.harvestJob.createMany).toBeCalledWith({
      data: [
        {
          id: 'id',
          reportId: 'download.report.id',
          period: {
            start: 'download.report.period.start',
            end: 'download.report.period.end',
          },
          release: '5.1',
          params: {
            access_method: ['download.report.params.access_method.0'],
            foo: 'download.dataHost.additionalParams.foo',
          },
          dataHostId: 'download.cacheKey',
          forceDownload: true,
          index: 'insert.index',
          status: 'pending',
        },
      ],
    });
  });
});
