import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from '../dto';
import {
  upsertDataHost,
  upsertReleaseSupportedByDataHost,
  upsertReportSupportedByDataHost,
} from './create';

describe(upsertDataHost, () => {
  const dataHost: DataHost = {
    createdAt: new Date(),
    id: '',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM',
    updatedAt: null,
  };

  test('should query DB', async () => {
    dbClient.dataHost.upsert.mockResolvedValueOnce(dataHost);

    await upsertDataHost(dataHost);

    expect(dbClient.dataHost.upsert).toBeCalled();
  });

  test('should return updated job', async () => {
    dbClient.dataHost.upsert.mockResolvedValueOnce(dataHost);

    const promise = upsertDataHost(dataHost);

    await expect(promise).resolves.toMatchObject(dataHost);
  });
});

describe(upsertReleaseSupportedByDataHost, () => {
  const release: DataHostSupportedRelease = {
    baseUrl: 'https://counter-datahost.example',
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    refreshedAt: null,
    release: '5.1',
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

describe(upsertReportSupportedByDataHost, () => {
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
