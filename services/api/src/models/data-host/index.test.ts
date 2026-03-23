import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from '~/models/data-host/dto';
import {
  doesDataHostExists,
  doesDataHostSupportsRelease,
  doesDataHostSupportsReport,
  findAllDataHost,
  findAllReleasesSupportedByDataHost,
  findAllReportsSupportedByDataHost,
  getDataHostWithSupportedData,
  upsertReleaseSupportedByDataHost,
  upsertReportSupportedByDataHost,
  deleteDataHost,
  deleteReleaseSupportedByDataHost,
  deleteReportSupportedByDataHost,
} from '~/models/data-host';

describe('CREATE Data Host', () => {
  describe('upsertReleaseSupportedByDataHost', () => {
    const release: DataHostSupportedRelease = {
      dataHostId: 'id',
      release: '5.1',
      baseUrl: 'https://counter-datahost.example',
      params: {},
      createdAt: new Date(),
      updatedAt: null,
    };

    test('should query DB', async () => {
      dbClient.dataHostSupportedRelease.upsert.mockResolvedValueOnce(release);

      await upsertReleaseSupportedByDataHost(release);

      expect(dbClient.dataHostSupportedRelease.upsert).toBeCalled();
    });

    test('should return updated job', async () => {
      dbClient.dataHostSupportedRelease.upsert.mockResolvedValueOnce(release);

      const promise = upsertReleaseSupportedByDataHost(release);

      await expect(promise).resolves.toMatchObject(release);
    });
  });

  describe('upsertReportSupportedByDataHost', () => {
    const report: DataHostSupportedReport = {
      dataHostId: 'id',
      release: '5.1',
      id: 'tr',
      params: {},
      supported: true,
      supportedOverride: null,
      firstMonthAvailable: '',
      firstMonthAvailableOverride: null,
      lastMonthAvailable: '',
      lastMonthAvailableOverride: null,
      createdAt: new Date(),
      updatedAt: null,
      refreshedAt: null,
    };

    test('should query DB', async () => {
      dbClient.dataHostSupportedReport.upsert.mockResolvedValueOnce(report);

      await upsertReportSupportedByDataHost(report);

      expect(dbClient.dataHostSupportedReport.upsert).toBeCalled();
    });

    test('should return updated job', async () => {
      dbClient.dataHostSupportedReport.upsert.mockResolvedValueOnce(report);

      const promise = upsertReportSupportedByDataHost(report);

      await expect(promise).resolves.toMatchObject(report);
    });
  });
});

describe('READ Data Host', () => {
  describe('doesDataHostExists', () => {
    test('should query DB', async () => {
      dbClient.dataHost.count.mockResolvedValueOnce(5);

      await doesDataHostExists('id');

      expect(dbClient.dataHost.count).toBeCalled();
    });

    test('should return true if found', async () => {
      dbClient.dataHost.count.mockResolvedValueOnce(1);

      const promise = doesDataHostExists('id');

      await expect(promise).resolves.toBe(true);
    });

    test('should return false if not found', async () => {
      dbClient.dataHost.count.mockResolvedValueOnce(0);

      const promise = doesDataHostExists('id');

      await expect(promise).resolves.toBe(false);
    });
  });

  describe('findAllDataHost', () => {
    test('should query DB', async () => {
      dbClient.dataHost.findMany.mockResolvedValueOnce([]);

      await findAllDataHost();

      expect(dbClient.dataHost.findMany).toBeCalled();
    });

    test('should return array', async () => {
      dbClient.dataHost.findMany.mockResolvedValueOnce([]);

      const promise = findAllDataHost();

      await expect(promise).resolves.toBeInstanceOf(Array);
    });
  });

  describe('doesDataHostSupportsRelease', () => {
    test('should query DB', async () => {
      dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(1);

      await doesDataHostSupportsRelease('id', '5');

      expect(dbClient.dataHostSupportedRelease.count).toBeCalled();
    });

    test('should return true if found', async () => {
      dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(1);

      const promise = doesDataHostSupportsRelease('id', '5.1');

      await expect(promise).resolves.toBe(true);
    });

    test('should return false if not found', async () => {
      dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(0);

      const promise = doesDataHostSupportsRelease('id', '5.1');

      await expect(promise).resolves.toBe(false);
    });
  });

  describe('findAllReleasesSupportedByDataHost', () => {
    test('should query DB', async () => {
      dbClient.dataHostSupportedRelease.findMany.mockResolvedValueOnce([]);

      await findAllReleasesSupportedByDataHost('id');

      expect(dbClient.dataHostSupportedRelease.findMany).toBeCalled();
    });

    test('should return array', async () => {
      dbClient.dataHostSupportedRelease.findMany.mockResolvedValueOnce([]);

      const promise = findAllReleasesSupportedByDataHost('id');

      await expect(promise).resolves.toBeInstanceOf(Array);
    });
  });

  describe('doesDataHostSupportsReport', () => {
    test('should query DB', async () => {
      dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(1);

      await doesDataHostSupportsReport('id', '5', 'tr');

      expect(dbClient.dataHostSupportedReport.count).toBeCalled();
    });

    test('should return true if found', async () => {
      dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(1);

      const promise = doesDataHostSupportsReport('id', '5.1', 'tr');

      await expect(promise).resolves.toBe(true);
    });

    test('should return false if not found', async () => {
      dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(0);

      const promise = doesDataHostSupportsReport('id', '5.1', 'tr');

      await expect(promise).resolves.toBe(false);
    });
  });

  describe('findAllReportsSupportedByDataHost', () => {
    test('should query DB', async () => {
      dbClient.dataHostSupportedReport.findMany.mockResolvedValueOnce([]);

      await findAllReportsSupportedByDataHost('id', '5.1');

      expect(dbClient.dataHostSupportedReport.findMany).toBeCalled();
    });

    test('should return array', async () => {
      dbClient.dataHostSupportedReport.findMany.mockResolvedValueOnce([]);

      const promise = findAllReportsSupportedByDataHost('id', '5.1');

      await expect(promise).resolves.toBeInstanceOf(Array);
    });
  });

  describe('getDataHostWithSupportedData', () => {
    const dataHost: DataHost = {
      id: '',
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM-dd',
      params: {},
      createdAt: new Date(),
      updatedAt: null,
    };
    const release: DataHostSupportedRelease = {
      dataHostId: '',
      release: '5.1',
      baseUrl: 'https://counter-datahost.com/',
      params: {},
      createdAt: new Date(),
      updatedAt: null,
    };
    const report: DataHostSupportedReport = {
      dataHostId: '',
      release: '5.1',
      id: 'tr',
      params: {},
      supported: false,
      supportedOverride: null,
      firstMonthAvailable: '',
      firstMonthAvailableOverride: null,
      lastMonthAvailable: '',
      lastMonthAvailableOverride: null,
      createdAt: new Date(),
      updatedAt: null,
      refreshedAt: null,
    };

    test('should query DB', async () => {
      dbClient.dataHost.findUnique.mockResolvedValueOnce({
        ...dataHost,
        // @ts-expect-error - Supported release will be included
        supportedReleases: [
          {
            ...release,
            supportedReports: [report],
          },
        ],
      });

      await getDataHostWithSupportedData('');

      expect(dbClient.dataHost.findUnique).toBeCalled();
    });

    test('should return data', async () => {
      dbClient.dataHost.findUnique.mockResolvedValueOnce({
        ...dataHost,
        // @ts-expect-error - Supported release will be included
        supportedReleases: [
          {
            ...release,
            supportedReports: [report],
          },
        ],
      });

      const result = await getDataHostWithSupportedData('');

      expect(result).toHaveProperty('id', '');
      expect(result).toHaveProperty('supportedReleases.0.release', '5.1');
      expect(result).toHaveProperty(
        'supportedReleases.0.supportedReports.0.id',
        'tr'
      );
    });

    test('should return null if not found', async () => {
      dbClient.dataHost.findUnique.mockResolvedValueOnce(null);

      const promise = getDataHostWithSupportedData('');

      await expect(promise).resolves.toBe(null);
    });
  });
});

describe('UPDATE Data Host', () => {
  describe('upsertReleaseSupportedByDataHost', () => {
    const release: DataHostSupportedRelease = {
      dataHostId: 'id',
      release: '5.1',
      baseUrl: 'https://counter-datahost.example',
      params: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test('should query DB', async () => {
      dbClient.dataHostSupportedRelease.upsert.mockResolvedValueOnce(release);

      await upsertReleaseSupportedByDataHost(release);

      expect(dbClient.dataHostSupportedRelease.upsert).toBeCalled();
    });

    test('should return updated job', async () => {
      dbClient.dataHostSupportedRelease.upsert.mockResolvedValueOnce(release);

      const promise = upsertReleaseSupportedByDataHost(release);

      await expect(promise).resolves.toMatchObject(release);
    });
  });

  describe('upsertReportSupportedByDataHost', () => {
    const report: DataHostSupportedReport = {
      dataHostId: 'id',
      release: '5.1',
      id: 'tr',
      params: {},
      supported: true,
      supportedOverride: null,
      firstMonthAvailable: '',
      firstMonthAvailableOverride: null,
      lastMonthAvailable: '',
      lastMonthAvailableOverride: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshedAt: null,
    };

    test('should query DB', async () => {
      dbClient.dataHostSupportedReport.upsert.mockResolvedValueOnce(report);

      await upsertReportSupportedByDataHost(report);

      expect(dbClient.dataHostSupportedReport.upsert).toBeCalled();
    });

    test('should return updated job', async () => {
      dbClient.dataHostSupportedReport.upsert.mockResolvedValueOnce(report);

      const promise = upsertReportSupportedByDataHost(report);

      await expect(promise).resolves.toMatchObject(report);
    });
  });
});

describe('DELETE Data Host', () => {
  describe('deleteDataHost', () => {
    test('should query DB', async () => {
      dbClient.dataHost.count.mockResolvedValueOnce(1);

      await deleteDataHost('id');

      expect(dbClient.dataHost.delete).toBeCalled();
    });

    test('should return if deleted', async () => {
      dbClient.dataHost.count.mockResolvedValueOnce(0);

      const promise = deleteDataHost('id');

      await expect(promise).resolves.toBe(false);
    });
  });

  describe('deleteReleaseSupportedByDataHost', () => {
    test('should query DB', async () => {
      dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(1);

      await deleteReleaseSupportedByDataHost('id', '5.1');

      expect(dbClient.dataHostSupportedRelease.delete).toBeCalled();
    });

    test('should return if deleted', async () => {
      dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(0);

      const promise = deleteReleaseSupportedByDataHost('id', '5.1');

      await expect(promise).resolves.toBe(false);
    });
  });

  describe('deleteReportSupportedByDataHost', () => {
    test('should query DB', async () => {
      dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(1);

      await deleteReportSupportedByDataHost('id', '5.1', 'tr');

      expect(dbClient.dataHostSupportedReport.delete).toBeCalled();
    });

    test('should return if deleted', async () => {
      dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(0);

      const promise = deleteReportSupportedByDataHost('id', '5.1', 'tr');

      await expect(promise).resolves.toBe(false);
    });
  });
});
