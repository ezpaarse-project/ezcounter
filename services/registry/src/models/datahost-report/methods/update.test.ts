import { describe, expect, it, vi } from 'vitest';

import type { DataHostReport } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { unsupportDataHostReport, updateDataHostReport } from './update';

describe('update report of Data Host', () => {
  const report: DataHostReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    params: {},
    release: '5.1',
    reportId: 'tr',
    supported: null,
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.update).mockResolvedValueOnce(report);

    await updateDataHostReport(
      {
        dataHostId: 'id',
        firstMonthAvailable: null,
        lastMonthAvailable: null,
        release: '5.1',
        reportId: 'tr',
        supported: null,
      },
      dbClient
    );

    expect(dbClient.dataHostReport.update).toHaveBeenCalledOnce();
  });

  it('should return updated report', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.update).mockResolvedValueOnce(report);

    const promise = updateDataHostReport(
      {
        dataHostId: 'id',
        firstMonthAvailable: null,
        lastMonthAvailable: null,
        params: {},
        release: '5.1',
        reportId: 'tr',
        supported: null,
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(report);
  });
});

describe('unsupport Data Host Report', () => {
  const report: DataHostReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    params: {},
    release: '5.1',
    reportId: 'tr',
    supported: true,
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.update).mockResolvedValueOnce(report);

    await unsupportDataHostReport(
      {
        dataHostId: 'id',
        release: '5.1',
        reportId: 'tr',
      },
      dbClient
    );

    expect(dbClient.dataHostReport.update).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: {
          supported: false,
        },
      })
    );
  });

  it('should return updated report with supported set to false', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.update).mockResolvedValueOnce(report);

    const promise = unsupportDataHostReport(
      {
        dataHostId: 'id',
        release: '5.1',
        reportId: 'tr',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(report);
  });
});
