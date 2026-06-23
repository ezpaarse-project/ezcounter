import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { dbClient } from '~/lib/prisma';

import {
  deleteDataHost,
  deleteReleaseSupportedByDataHost,
  deleteReportSupportedByDataHost,
} from './delete';

describe('delete Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    // @ts-expect-error Prisma types are complex
    vi.mocked(mockedTx.dataHost.count).mockResolvedValueOnce({ id: 1 });

    await deleteDataHost('id', dbClient);

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(mockedTx.dataHost.delete).toHaveBeenCalledExactlyOnceWith({
      where: { id: 'id' },
    });
  });

  it('should return if deleted', async () => {
    expect.assertions(1);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    // @ts-expect-error Prisma types are complex
    vi.mocked(mockedTx.dataHost.count).mockResolvedValueOnce({ id: 0 });

    const promise = deleteDataHost('id', dbClient);

    await expect(promise).resolves.toBe(false);
  });
});

describe('delete release supported by Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    // @ts-expect-error Prisma types are complex
    vi.mocked(mockedTx.dataHostSupportedRelease.count).mockResolvedValueOnce({
      release: 1,
    });

    await deleteReleaseSupportedByDataHost(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(
      mockedTx.dataHostSupportedRelease.delete
    ).toHaveBeenCalledExactlyOnceWith({
      where: {
        dataHostId_release: {
          dataHostId: 'id',
          release: '5.1',
        },
      },
    });
  });

  it('should return if deleted', async () => {
    expect.assertions(1);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    vi.mocked(mockedTx.dataHostSupportedRelease.count).mockResolvedValueOnce(0);

    const promise = deleteReleaseSupportedByDataHost(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});

describe('delete report supported by Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    vi.mocked(mockedTx.dataHostSupportedReport.count).mockResolvedValueOnce(1);

    await deleteReportSupportedByDataHost(
      { dataHostId: 'id', release: '5.1', report: 'tr' },
      dbClient
    );

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(
      mockedTx.dataHostSupportedReport.delete
    ).toHaveBeenCalledExactlyOnceWith({
      where: {
        dataHostId_release_id: {
          dataHostId: 'id',
          id: 'tr',
          release: '5.1',
        },
      },
    });
  });

  it('should return if deleted', async () => {
    expect.assertions(1);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    vi.mocked(mockedTx.dataHostSupportedReport.count).mockResolvedValueOnce(0);

    const promise = deleteReportSupportedByDataHost(
      { dataHostId: 'id', release: '5.1', report: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});
