import { describe, expect, test, vi } from 'vitest';

import {
  DataHostRefreshData,
  type HarvestRequestData,
} from '@ezcounter/dto/queues';

import { mockedChannel } from '~/lib/__mocks__/rabbitmq';

import type { DataHostSupportedRelease } from '~/models/data-host/dto';
import { findAllReleasesSupportedByDataHost } from '~/models/data-host/__mocks__';
import { createManyHarvestJob } from '~/models/harvest/__mocks__';
import { prepareHarvestJobsFromHarvestRequest } from '~/models/harvest/__mocks__/prepare';

import {
  processRefreshQueue,
  queueDataHostRefresh,
} from '../data-host/__mocks__/refresh';
import { queueHarvestJobs } from './__mocks__/dispatch';
import { onHarvestRequest } from './request';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/models/harvest'));
vi.mock(import('~/models/harvest/prepare'));
vi.mock(import('../data-host/refresh'));
vi.mock(import('./dispatch'));

describe('Process Harvest Request (onHarvestRequest)', () => {
  const request: HarvestRequestData = [
    {
      download: {
        dataHost: {
          auth: { customer_id: 'foobar' },
          id: 'my-counter-datahost',
        },

        reports: [
          {
            id: 'tr',
            params: { attributes_to_show: ['Access_Method'] },
            period: { end: '2025-12', start: '2025-01' },
            release: '5',
          },
          {
            id: 'pr',
            period: { end: '2025-11', start: '2025-02' },
            release: '5',
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

        reports: [
          {
            id: 'ir',
            period: { end: '2025-12', start: '2025-01' },
            release: '5.1',
            splitPeriodBy: 1,
          },
          {
            id: 'pr',
            period: { end: '2025-11', start: '2025-02' },
            release: '5',
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

  describe('refresh supported reports', () => {
    test('should queue data host refresh', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(queueDataHostRefresh).toHaveBeenCalled();
    });

    test('should correctly name queues', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(queueDataHostRefresh).toHaveBeenCalledWith(
        expect.stringMatching(/^ezcounter:data-host\.refresh:[a-z0-9]{16}$/),
        expect.schemaMatching(DataHostRefreshData)
      );
    });

    test('should group auths', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(queueDataHostRefresh).toHaveBeenCalledWith(
        expect.stringContaining(''),
        {
          dataHost: {
            auths: [{ customer_id: 'foobar' }, { customer_id: 'barfoo' }],
            id: 'my-counter-datahost',
          },
          id: expect.stringContaining(''),
          release: '5',
        }
      );
    });

    test('should group data host refresh by hostname', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(mockedChannel.queueDeclare).toHaveBeenCalledOnce();
    });

    test('should ignore unsupported releases', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce([releases[0]]);

      await onHarvestRequest(request);

      expect(queueDataHostRefresh).toHaveBeenCalledOnce();
    });

    test('should wait for refresh', async () => {
      findAllReleasesSupportedByDataHost.mockResolvedValueOnce(releases);

      await onHarvestRequest(request);

      expect(processRefreshQueue).toBeCalled();
    });
  });

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
