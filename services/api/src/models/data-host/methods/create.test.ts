import { describe, expect, it, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

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

describe('upsert Data Host', () => {
  const dataHost: DataHost = {
    createdAt: new Date(),
    id: '',
    params: {},
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHost.upsert).mockResolvedValueOnce(dataHost);

    await upsertDataHost(dataHost, dbClient);

    expect(dbClient.dataHost.upsert).toHaveBeenCalledOnce();
  });

  it('should return updated job', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHost.upsert).mockResolvedValueOnce(dataHost);

    const promise = upsertDataHost(dataHost, dbClient);

    await expect(promise).resolves.toMatchObject(dataHost);
  });
});

describe('upsert release supported by Data Host', () => {
  const release: DataHostSupportedRelease = {
    baseUrl: 'https://counter-datahost.example',
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM',
    release: '5.1',
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedRelease.upsert).mockResolvedValueOnce(
      release
    );

    await upsertReleaseSupportedByDataHost(release, dbClient);

    expect(dbClient.dataHostSupportedRelease.upsert).toHaveBeenCalledOnce();
  });

  it('should return updated job', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedRelease.upsert).mockResolvedValueOnce(
      release
    );

    const promise = upsertReleaseSupportedByDataHost(release, dbClient);

    await expect(promise).resolves.toMatchObject(release);
  });
});

describe('upsert report supported by Data Host', () => {
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

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.upsert).mockResolvedValueOnce(
      report
    );

    await upsertReportSupportedByDataHost(report, dbClient);

    expect(dbClient.dataHostSupportedReport.upsert).toHaveBeenCalledOnce();
  });

  it('should return updated job', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.upsert).mockResolvedValueOnce(
      report
    );

    const promise = upsertReportSupportedByDataHost(report, dbClient);

    await expect(promise).resolves.toMatchObject(report);
  });
});
