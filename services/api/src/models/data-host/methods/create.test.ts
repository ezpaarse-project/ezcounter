import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import type { DataHostSupportedRelease, DataHostSupportedReport } from '../dto';
import {
  upsertReleaseSupportedByDataHost,
  upsertReportSupportedByDataHost,
} from './create';

describe('upsertReleaseSupportedByDataHost', () => {
  const release: DataHostSupportedRelease = {
    dataHostId: 'id',
    release: '5.1',
    baseUrl: 'https://counter-datahost.example',
    params: {},
    createdAt: new Date(),
    updatedAt: null,
    refreshedAt: null,
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
