import { describe, expect, it, vi } from 'vitest';

import type { DataHostReport } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import {
  countAllDataHostReport,
  doesDataHostReportExists,
  findAllDataHostReport,
  findOneDataHostReport,
} from './read';

describe('does Data Host supports report', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostReport.count).mockResolvedValueOnce({
      reportId: 1,
    });

    await doesDataHostReportExists(
      { dataHostId: 'id', release: '5', reportId: 'tr' },
      dbClient
    );

    expect(dbClient.dataHostReport.count).toHaveBeenCalledOnce();
  });

  it('should return true if found', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostReport.count).mockResolvedValueOnce({
      reportId: 1,
    });

    const promise = doesDataHostReportExists(
      { dataHostId: 'id', release: '5.1', reportId: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostReport.count).mockResolvedValueOnce({
      reportId: 0,
    });

    const promise = doesDataHostReportExists(
      { dataHostId: 'id', release: '5.1', reportId: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});

describe('find all reports supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostReport.findMany).mockResolvedValueOnce([]);

    await findAllDataHostReport(
      { dataHostId: 'id', release: '5.1' },
      {
        orderBy: { reportId: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(dbClient.dataHostReport.findMany).toHaveBeenCalledExactlyOnceWith({
      include: { changes: { orderBy: { createdAt: 'asc' } } },
      orderBy: { reportId: 'asc' },
      skip: 50,
      take: 25,
      where: {
        dataHostId: 'id',
        release: '5.1',
      },
    });
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostReport.findMany).mockResolvedValueOnce([]);

    const promise = findAllDataHostReport(
      { dataHostId: 'id', release: '5.1' },
      {},
      dbClient
    );

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('count all reports supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostReport.count).mockResolvedValueOnce({
      reportId: 0,
    });

    await countAllDataHostReport(
      { dataHostId: 'id', release: '5' },
      null,
      dbClient
    );

    expect(dbClient.dataHostReport.count).toHaveBeenCalledExactlyOnceWith({
      select: { reportId: true },
      where: {
        dataHostId: 'id',
        release: '5',
      },
    });
  });
});

describe('find one report supported by Data Host', () => {
  const report: DataHostReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: '',
    lastMonthAvailable: '',
    params: {},
    release: '5.1',
    reportId: 'tr',
    supported: true,
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.findUniqueOrThrow).mockResolvedValueOnce(
      report
    );

    await findOneDataHostReport(
      { dataHostId: 'id', release: '5.1', reportId: 'tr' },
      dbClient
    );

    expect(
      dbClient.dataHostReport.findUniqueOrThrow
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        include: {
          changes: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })
    );
  });

  it('should return report', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.findUniqueOrThrow).mockResolvedValueOnce(
      report
    );

    const promise = findOneDataHostReport(
      { dataHostId: 'id', release: '5.1', reportId: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(report);
  });
});
