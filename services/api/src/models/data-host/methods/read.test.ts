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
  findOneReportSupportedByDataHost,
} from './read';

describe(doesDataHostExists, () => {
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

describe(findAllDataHost, () => {
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

describe(doesDataHostSupportsRelease, () => {
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

describe(findAllReleasesSupportedByDataHost, () => {
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

describe(doesDataHostSupportsReport, () => {
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

describe(findAllReportsSupportedByDataHost, () => {
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

describe(findOneReportSupportedByDataHost, () => {
  const report: DataHostSupportedReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: '',
    firstMonthAvailableOverride: null,
    id: 'tr',
    lastMonthAvailable: '',
    lastMonthAvailableOverride: null,
    params: {},
    release: '5.1',
    supported: true,
    supportedOverride: null,
    updatedAt: null,
  };

  test('should query DB', async () => {
    dbClient.dataHostSupportedReport.findUnique.mockResolvedValueOnce(null);

    await findOneReportSupportedByDataHost('id', '5.1', 'tr');

    expect(dbClient.dataHostSupportedReport.findUnique).toBeCalled();
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
