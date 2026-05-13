import { describe, expect, test, vi } from 'vitest';

import type { HarvestRequestData } from '@ezcounter/dto/queues';

import type { DataHostSupportedRelease } from '~/models/data-host/dto';
import { findAllReleasesSupportedByDataHost } from '~/models/data-host/__mocks__';
import { prepareHarvestJobsFromHarvestRequest } from '~/models/harvest-request/__mocks__';
import { createManyHarvestJob } from '~/models/harvest/__mocks__';

import { queueHarvestJobs } from './__mocks__/dispatch';
import { onHarvestRequest } from './request';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/models/harvest'));
vi.mock(import('~/models/harvest-request'));
vi.mock(import('./dispatch'));

describe('Process Harvest Request (onHarvestRequest)', () => {
  const request: HarvestRequestData = [
    {
      download: {
        dataHost: {
          auth: { customer_id: 'foobar' },
          id: 'my-counter-datahost',
        },

        release: '5',
        reports: [
          {
            id: 'tr',
            params: { attributes_to_show: ['Access_Method'] },
            period: { end: '2025-12', start: '2025-01' },
          },
          {
            id: 'pr',
            period: { end: '2025-11', start: '2025-02' },
          },
        ],
      },
      insert: {
        additionalData: {
          'X-Custom': 'Property',
        },
        index: 'z-example-counter5',
      },
    },
    {
      download: {
        dataHost: {
          auth: { customer_id: 'barfoo' },
          id: 'my-counter-datahost',
        },

        release: '5.1',
        reports: [
          {
            id: 'ir',
            period: { end: '2025-12', start: '2025-01' },
            splitPeriodBy: 1,
          },
          {
            id: 'pr',
            period: { end: '2025-11', start: '2025-02' },
          },
        ],
      },
      insert: {
        index: 'z-example-counter51',
      },
    },
  ];

  const releases: DataHostSupportedRelease[] = [
    {
      baseUrl: 'https://datahost.localhost/r51',
      createdAt: new Date(),
      dataHostId: 'my-counter-datahost',
      params: {},
      refreshedAt: null,
      release: '5.1',
      updatedAt: null,
    },
    {
      baseUrl: 'https://datahost.localhost',
      createdAt: new Date(),
      dataHostId: 'my-counter-datahost',
      params: {},
      refreshedAt: null,
      release: '5',
      updatedAt: null,
    },
  ];

  describe('harvest jobs', () => {
    test('should transform request into jobs', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(prepareHarvestJobsFromHarvestRequest).toBeCalled();
    });

    test('should create jobs in DB', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(createManyHarvestJob).toBeCalled();
    });

    test('should queue jobs', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(queueHarvestJobs).toBeCalled();
    });
  });
});
