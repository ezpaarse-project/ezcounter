import { describe, expect, it, vi } from 'vitest';

import type { DataHostReport, DataHostReportChange } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

import { createDataHostReport, createDataHostReportChange } from './create';

describe('create report of Data Host', () => {
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
    vi.mocked(dbClient.dataHostReport.create).mockResolvedValueOnce(report);

    await createDataHostReport(
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

    expect(dbClient.dataHostReport.create).toHaveBeenCalledOnce();
  });

  it('should return updated report', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReport.create).mockResolvedValueOnce(report);

    const promise = createDataHostReport(
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

describe('create Report Change of Data Host', () => {
  const change: DataHostReportChange = {
    createdAt: new Date(),
    dataHostId: 'id',
    diff: [
      {
        key: 'supported',
        newValue: { key: 'supported', value: false },
        oldValue: { key: 'supported', value: true },
        type: 'changed',
      },
    ],
    id: 'change-id',
    release: '5.1',
    reportId: 'tr',
  };

  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReportChange.create).mockResolvedValueOnce(
      change
    );

    await createDataHostReportChange(
      {
        dataHostId: 'id',
        diff: [
          {
            key: 'supported',
            newValue: { key: 'supported', value: false },
            oldValue: { key: 'supported', value: true },
            type: 'changed',
          },
        ],
        release: '5.1',
        reportId: 'tr',
      },
      dbClient
    );

    expect(dbClient.dataHostReportChange.create).toHaveBeenCalledOnce();
  });

  it('should return created change', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHostReportChange.create).mockResolvedValueOnce(
      change
    );

    const promise = createDataHostReportChange(
      {
        dataHostId: 'id',
        diff: [
          {
            key: 'supported',
            newValue: { key: 'supported', value: false },
            oldValue: { key: 'supported', value: true },
            type: 'changed',
          },
        ],
        id: '',
        release: '5.1',
        reportId: 'tr',
      },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(change);
  });
});
