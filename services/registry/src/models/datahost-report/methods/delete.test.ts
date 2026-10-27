import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { dbClient } from '~/lib/prisma';

import { deleteDataHostReport } from './delete';

describe('delete report supported by Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    // @ts-expect-error Prisma types are complex
    vi.mocked(mockedTx.dataHostReport.count).mockResolvedValueOnce({
      id: 1,
    });

    await deleteDataHostReport(
      { dataHostId: 'id', release: '5.1', reportId: 'tr' },
      dbClient
    );

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(mockedTx.dataHostReport.delete).toHaveBeenCalledExactlyOnceWith({
      where: {
        dataHostId_release_reportId: {
          dataHostId: 'id',
          release: '5.1',
          reportId: 'tr',
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

    vi.mocked(mockedTx.dataHostReport.count).mockResolvedValueOnce(0);

    const promise = deleteDataHostReport(
      { dataHostId: 'id', release: '5.1', reportId: 'tr' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});
