import { describe, expect, it } from 'vitest';

import type { HarvestJobData } from '@ezcounter/dto/queues';

import { dbClient } from '~/lib/prisma';

import { createManyHarvestJob } from './create';

describe('create many Harvest Job', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    await createManyHarvestJob([], '', dbClient);

    expect(dbClient.harvestJob.createMany).toHaveBeenCalledOnce();
  });

  it('should transform input', async () => {
    expect.hasAssertions();
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
        release: '5.1',
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
        },
        timeout: 10,
      },
      id: 'id',
      insert: {
        index: 'insert.index',
      },
    };

    await createManyHarvestJob([item], 'test-request', dbClient);

    expect(dbClient.harvestJob.createMany).toHaveBeenCalledWith({
      data: [
        {
          dataHostId: 'download.cacheKey',
          enrich: { status: 'pending' },
          enrichSources: ['ezunpaywall', 'openalex'],
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
          requestId: 'test-request',
          status: 'pending',
        },
      ],
    });
  });

  it('should mark enrich as skipped if no sources', async () => {
    expect.hasAssertions();
    const item: HarvestJobData = {
      download: {
        cacheKey: 'download.cacheKey',
        dataHost: {
          auth: {},
          baseUrl: 'download.dataHost.baseUrl',
        },
        release: '5.1',

        report: {
          id: 'download.report.id',
          period: {
            end: 'download.report.period.end',
            start: 'download.report.period.start',
          },
        },
        timeout: 10,
      },
      enrich: {
        sources: [],
      },
      id: 'id',
      insert: {
        index: 'insert.index',
      },
    };

    await createManyHarvestJob([item], '', dbClient);

    expect(dbClient.harvestJob.createMany).toHaveBeenCalledWith({
      data: [
        {
          dataHostId: 'download.cacheKey',
          enrich: { status: 'skipped' },
          enrichSources: [],
          id: 'id',
          index: 'insert.index',
          period: {
            end: 'download.report.period.end',
            start: 'download.report.period.start',
          },
          release: '5.1',
          reportId: 'download.report.id',
          requestId: '',
          status: 'pending',
        },
      ],
    });
  });
});
