import { describe, expect, it, vi } from 'vitest';

import type { HarvestRequestData } from '@ezcounter/dto/queues';
import type { MessageMeta } from '@ezcounter/rabbitmq';

import type { DataHostSupportedRelease } from '~/models/data-host/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/data-host/__mocks__';
import { prepareHarvestJobsFromHarvestRequest } from '~/models/harvest-request';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedHarvestJobModel } from '~/models/harvest/__mocks__';

import { queueHarvestJobs } from './dispatch';
import { onHarvestRequest } from './request';

vi.mock(import('~/models/data-host'));
vi.mock(import('~/models/harvest'));
vi.mock(import('~/models/harvest-request'));
vi.mock(import('./dispatch'));

describe('process Harvest Request', () => {
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
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM-dd',
      release: '5.1',
      updatedAt: null,
    },
    {
      baseUrl: 'https://datahost.localhost',
      createdAt: new Date(),
      dataHostId: 'my-counter-datahost',
      params: {},
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM-dd',
      release: '5',
      updatedAt: null,
    },
  ];

  describe('harvest jobs', () => {
    it('should transform request into jobs', async () => {
      expect.hasAssertions();
      vi.mocked(
        mockedDataHostModel.findAllReleasesSupported
      ).mockResolvedValueOnce(releases);
      vi.mocked(queueHarvestJobs).mockImplementationOnce((jobs) =>
        Promise.resolve(jobs.map(({ id }) => ({ id })))
      );

      await onHarvestRequest(request, {
        messageId: 'test-request',
      } as MessageMeta);

      expect(prepareHarvestJobsFromHarvestRequest).toHaveBeenCalledOnce();
    });

    it('should create jobs in DB', async () => {
      expect.hasAssertions();
      vi.mocked(
        mockedDataHostModel.findAllReleasesSupported
      ).mockResolvedValueOnce(releases);
      vi.mocked(queueHarvestJobs).mockImplementationOnce((jobs) =>
        Promise.resolve(jobs.map(({ id }) => ({ id })))
      );

      await onHarvestRequest(request, {
        messageId: 'test-request',
      } as MessageMeta);

      expect(mockedHarvestJobModel.createMany).toHaveBeenCalledOnce();
    });

    it('should queue jobs', async () => {
      expect.hasAssertions();
      vi.mocked(
        mockedDataHostModel.findAllReleasesSupported
      ).mockResolvedValueOnce(releases);
      vi.mocked(queueHarvestJobs).mockImplementationOnce((jobs) =>
        Promise.resolve(jobs.map(({ id }) => ({ id })))
      );

      await onHarvestRequest(request, {
        messageId: 'test-request',
      } as MessageMeta);

      expect(queueHarvestJobs).toHaveBeenCalledOnce();
    });
  });
});
