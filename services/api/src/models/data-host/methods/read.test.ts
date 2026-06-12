import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import type { DataHostSupportedReport } from '../dto';
import {
  doesDataHostExists,
  doesDataHostSupportsRelease,
  doesDataHostSupportsReport,
  findAllDataHost,
  findAllReleasesSupportedByDataHost,
  findAllReportsSupportedByDataHost,
  findOneReleaseSupportedByDataHost,
  findOneReportSupportedByDataHost,
} from './read';

describe(doesDataHostExists, () => {
  test('should query DB', async () => {
    dbClient.dataHost.count.mockResolvedValueOnce(5);

    await doesDataHostExists('id');

    expect(dbClient.dataHost.count).toHaveBeenCalled();
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

describe(findAllDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHost.findMany.mockResolvedValueOnce([]);

    await findAllDataHost();

    expect(dbClient.dataHost.findMany).toHaveBeenCalled();
  });

  test('should return array', async () => {
    dbClient.dataHost.findMany.mockResolvedValueOnce([]);

    const promise = findAllDataHost();

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe(doesDataHostSupportsRelease, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(1);

    await doesDataHostSupportsRelease('id', '5');

    expect(dbClient.dataHostSupportedRelease.count).toHaveBeenCalled();
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

describe(findAllReleasesSupportedByDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedRelease.findMany.mockResolvedValueOnce([]);

    await findAllReleasesSupportedByDataHost('id');

    expect(dbClient.dataHostSupportedRelease.findMany).toHaveBeenCalled();
  });

  test('should return array', async () => {
    dbClient.dataHostSupportedRelease.findMany.mockResolvedValueOnce([]);

    const promise = findAllReleasesSupportedByDataHost('id');

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe(doesDataHostSupportsReport, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(1);

    await doesDataHostSupportsReport('id', '5', 'tr');

    expect(dbClient.dataHostSupportedReport.count).toHaveBeenCalled();
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

describe(findAllReportsSupportedByDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedReport.findMany.mockResolvedValueOnce([]);

    await findAllReportsSupportedByDataHost('id', '5.1');

    expect(dbClient.dataHostSupportedReport.findMany).toHaveBeenCalled();
  });

  test('should return array', async () => {
    dbClient.dataHostSupportedReport.findMany.mockResolvedValueOnce([]);

    const promise = findAllReportsSupportedByDataHost('id', '5.1');

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe(findOneReleaseSupportedByDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedRelease.findUniqueOrThrow.mockResolvedValueOnce({
      baseUrl: 'https://counter.localhost/r51',
      createdAt: new Date(),
      // @ts-expect-error - Should include DataHost
      dataHost: {
        createdAt: new Date(),
        id: ':id',
        params: {},
        updatedAt: null,
      },
      dataHostId: 'id',
      params: {},
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM-dd',
      release: '5.1',
      updatedAt: null,
    });

    await findOneReleaseSupportedByDataHost('id', '5.1');

    expect(
      dbClient.dataHostSupportedRelease.findUniqueOrThrow
    ).toHaveBeenCalled();
  });
});

describe(findOneReportSupportedByDataHost, () => {
  const report: DataHostSupportedReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: '',
    id: 'tr',
    lastMonthAvailable: '',
    params: {},
    release: '5.1',
    supported: true,
    updatedAt: null,
  };

  test('should query DB', async () => {
    dbClient.dataHostSupportedReport.findUnique.mockResolvedValueOnce(null);

    await findOneReportSupportedByDataHost('id', '5.1', 'tr');

    expect(dbClient.dataHostSupportedReport.findUnique).toHaveBeenCalled();
  });

  test('should return report', async () => {
    dbClient.dataHostSupportedReport.findUnique.mockResolvedValueOnce(report);

    const promise = findOneReportSupportedByDataHost('id', '5.1', 'tr');

    await expect(promise).resolves.toMatchObject(report);
  });

  test('should return null if not found', async () => {
    dbClient.dataHostSupportedReport.findUnique.mockResolvedValueOnce(null);

    const promise = findOneReportSupportedByDataHost('id', '5.1', 'tr');

    await expect(promise).resolves.toBe(null);
  });
});
