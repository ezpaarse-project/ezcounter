import { describe, expect, it, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

import type {
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from '../dto';
import {
  countAllDataHost,
  countAllReleasesSupportedByDataHost,
  countAllReportsSupportedByDataHost,
  doesDataHostExists,
  doesDataHostSupportsRelease,
  doesDataHostSupportsReport,
  findAllDataHost,
  findAllReleasesSupportedByDataHost,
  findAllReportsSupportedByDataHost,
  findOneDataHost,
  findOneDataHostWithSupportedData,
  findOneReleaseSupportedByDataHost,
  findOneReportSupportedByDataHost,
} from './read';

describe('does Data Host exists', () => {
  it('should query DB', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({
      id: 5,
    });

    await doesDataHostExists('id', dbClient);

    expect(dbClient.dataHost.count).toHaveBeenCalledOnce();
  });

  it('should return true if found', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({ id: 1 });

    const promise = doesDataHostExists('id', dbClient);

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({ id: 0 });

    const promise = doesDataHostExists('id', dbClient);

    await expect(promise).resolves.toBe(false);
  });
});

describe('find all Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    vi.mocked(dbClient.dataHost.findMany).mockResolvedValueOnce([]);

    await findAllDataHost(
      {
        'createdAt[gte]': new Date('2025-01-01T00:00:00.000Z'),
        includes: ['supportedReleases'],
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(dbClient.dataHost.findMany).toHaveBeenCalledExactlyOnceWith({
      include: { supportedReleases: true },
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
      where: {
        createdAt: {
          gte: new Date('2025-01-01T00:00:00.000Z'),
          lte: undefined,
        },
      },
    });
    expect(dbClient.dataHost.findMany).toHaveBeenCalledOnce();
  });

  it('should return array', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.findMany).mockResolvedValueOnce([]);

    const promise = findAllDataHost({}, dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('count all Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHost.count).mockResolvedValueOnce({
      id: 0,
    });

    await countAllDataHost(
      {
        'createdAt[lte]': new Date('2025-01-01T00:00:00.000Z'),
      },
      dbClient
    );

    expect(dbClient.dataHost.count).toHaveBeenCalledExactlyOnceWith({
      select: { id: true },
      where: {
        createdAt: {
          gte: undefined,
          lte: new Date('2025-01-01T00:00:00.000Z'),
        },
      },
    });
  });
});

describe('find one Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(1);
    vi.mocked(dbClient.dataHost.findUniqueOrThrow).mockResolvedValueOnce({
      createdAt: new Date(),
      id: 'id',
      params: {},
      updatedAt: null,
    });

    await findOneDataHost('id', dbClient, ['supportedReleases']);

    expect(dbClient.dataHost.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      {
        include: { supportedReleases: true },
        where: { id: 'id' },
      }
    );
  });
});

describe('does Data Host supports release', () => {
  it('should query DB', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostSupportedRelease.count).mockResolvedValueOnce({
      release: 1,
    });

    await doesDataHostSupportsRelease(
      { dataHostId: 'id', release: '5' },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedRelease.count
    ).toHaveBeenCalledExactlyOnceWith({
      select: { release: true },
      where: { dataHostId: 'id', release: '5' },
    });
  });

  it('should return true if found', async () => {
    expect.assertions(1);
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostSupportedRelease.count).mockResolvedValueOnce({
      release: 1,
    });

    const promise = doesDataHostSupportsRelease(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedRelease.count).mockResolvedValueOnce(0);

    const promise = doesDataHostSupportsRelease(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});

describe('find all releases supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedRelease.findMany).mockResolvedValueOnce(
      []
    );

    await findAllReleasesSupportedByDataHost(
      'id',
      {
        'createdAt[gte]': new Date('2025-01-01T00:00:00.000Z'),
        includes: ['supportedReports'],
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedRelease.findMany
    ).toHaveBeenCalledExactlyOnceWith({
      include: { supportedReports: true },
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
      where: {
        createdAt: {
          gte: new Date('2025-01-01T00:00:00.000Z'),
          lte: undefined,
        },
        dataHostId: 'id',
      },
    });
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedRelease.findMany).mockResolvedValueOnce(
      []
    );

    const promise = findAllReleasesSupportedByDataHost('id', {}, dbClient);

    await expect(promise).resolves.toBeInstanceOf(Array);
  });
});

describe('count all releases supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    // @ts-expect-error Prisma types are complex
    vi.mocked(dbClient.dataHostSupportedRelease.count).mockResolvedValueOnce({
      release: 0,
    });

    await countAllReleasesSupportedByDataHost(
      'id',
      {
        'createdAt[lte]': new Date('2025-01-01T00:00:00.000Z'),
      },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedRelease.count
    ).toHaveBeenCalledExactlyOnceWith({
      select: { release: true },
      where: {
        createdAt: {
          gte: undefined,
          lte: new Date('2025-01-01T00:00:00.000Z'),
        },
        dataHostId: 'id',
      },
    });
  });
});

describe('does Data Host supports report', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.count).mockResolvedValueOnce(1);

    await doesDataHostSupportsReport(
      { dataHostId: 'id', release: '5', report: 'tr' },
      dbClient
    );

    expect(dbClient.dataHostSupportedReport.count).toHaveBeenCalledOnce();
  });

  it('should return true if found', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.count).mockResolvedValueOnce(1);

    const promise = doesDataHostSupportsReport(
      { dataHostId: 'id', release: '5.1', report: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toBe(true);
  });

  it('should return false if not found', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.count).mockResolvedValueOnce(0);

    const promise = doesDataHostSupportsReport(
      { dataHostId: 'id', release: '5.1', report: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});

describe('find all reports supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.findMany).mockResolvedValueOnce(
      []
    );

    await findAllReportsSupportedByDataHost(
      { dataHostId: 'id', release: '5.1' },
      {
        'createdAt[gte]': new Date('2025-01-01T00:00:00.000Z'),
        orderBy: { id: 'asc' },
        skip: 50,
        take: 25,
      },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedReport.findMany
    ).toHaveBeenCalledExactlyOnceWith({
      orderBy: { id: 'asc' },
      skip: 50,
      take: 25,
      where: {
        createdAt: {
          gte: new Date('2025-01-01T00:00:00.000Z'),
          lte: undefined,
        },
        dataHostId: 'id',
        release: '5.1',
      },
    });
  });

  it('should return array', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHostSupportedReport.findMany).mockResolvedValueOnce(
      []
    );

    const promise = findAllReportsSupportedByDataHost(
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
    vi.mocked(dbClient.dataHostSupportedReport.count).mockResolvedValueOnce({
      id: 0,
    });

    await countAllReportsSupportedByDataHost(
      { dataHostId: 'id', release: '5' },
      {
        'createdAt[lte]': new Date('2025-01-01T00:00:00.000Z'),
      },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedReport.count
    ).toHaveBeenCalledExactlyOnceWith({
      select: { id: true },
      where: {
        createdAt: {
          gte: undefined,
          lte: new Date('2025-01-01T00:00:00.000Z'),
        },
        dataHostId: 'id',
        release: '5',
      },
    });
  });
});

describe('find one release supported by Data Host', () => {
  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(
      dbClient.dataHostSupportedRelease.findUniqueOrThrow
    ).mockResolvedValueOnce({
      baseUrl: 'https://counter.localhost/r51',
      createdAt: new Date(),
      dataHostId: 'id',
      params: {},
      paramsSeparator: '|',
      periodFormat: 'yyyy-MM-dd',
      release: '5.1',
      updatedAt: null,
    });

    await findOneReleaseSupportedByDataHost(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedRelease.findUniqueOrThrow
    ).toHaveBeenCalledOnce();
  });
});

describe('find one report supported by Data Host', () => {
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
    vi.mocked(
      dbClient.dataHostSupportedReport.findUniqueOrThrow
    ).mockResolvedValueOnce(report);

    await findOneReportSupportedByDataHost(
      { dataHostId: 'id', release: '5.1', report: 'tr' },
      dbClient
    );

    expect(
      dbClient.dataHostSupportedReport.findUniqueOrThrow
    ).toHaveBeenCalledOnce();
  });

  it('should return report', async () => {
    expect.hasAssertions();
    vi.mocked(
      dbClient.dataHostSupportedReport.findUniqueOrThrow
    ).mockResolvedValueOnce(report);

    const promise = findOneReportSupportedByDataHost(
      { dataHostId: 'id', release: '5.1', report: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toMatchObject(report);
  });
});

describe('find one Data Host with supported data', () => {
  const dataHost: DataHostWithSupportedData = {
    createdAt: new Date(),
    id: '',
    params: {},
    supportedReleases: [
      {
        baseUrl: 'https://counter-datahost.com/',
        createdAt: new Date(),
        dataHostId: '',
        params: {},
        paramsSeparator: '|',
        periodFormat: 'yyyy-MM-dd',
        release: '5.1',
        supportedReports: [
          {
            createdAt: new Date(),
            dataHostId: '',
            firstMonthAvailable: '',
            id: 'tr',
            lastMonthAvailable: '',
            params: {},
            release: '5.1',
            supported: false,
            updatedAt: null,
          },
        ],
        updatedAt: null,
      },
    ],
    updatedAt: null,
  };

  it('should query DB', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHost.findUniqueOrThrow).mockResolvedValueOnce(
      dataHost
    );

    await findOneDataHostWithSupportedData('', dbClient);

    expect(dbClient.dataHost.findUniqueOrThrow).toHaveBeenCalledOnce();
  });

  it('should return data', async () => {
    expect.hasAssertions();
    vi.mocked(dbClient.dataHost.findUniqueOrThrow).mockResolvedValueOnce(
      dataHost
    );

    const result = await findOneDataHostWithSupportedData('', dbClient);

    expect(result).toHaveProperty('id', '');
    expect(result).toHaveProperty('supportedReleases.0.release', '5.1');
    expect(result).toHaveProperty(
      'supportedReleases.0.supportedReports.0.id',
      'tr'
    );
  });
});
