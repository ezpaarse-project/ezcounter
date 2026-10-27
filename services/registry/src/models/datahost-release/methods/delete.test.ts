import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { dbClient } from '~/lib/prisma';

import { deleteDataHostRelease } from './delete';

describe('delete release supported by Data Host', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    // @ts-expect-error Prisma types are complex
    vi.mocked(mockedTx.dataHostRelease.count).mockResolvedValueOnce({
      release: 1,
    });

    await deleteDataHostRelease({ dataHostId: 'id', release: '5.1' }, dbClient);

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(mockedTx.dataHostRelease.delete).toHaveBeenCalledExactlyOnceWith({
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

    vi.mocked(mockedTx.dataHostRelease.count).mockResolvedValueOnce(0);

    const promise = deleteDataHostRelease(
      { dataHostId: 'id', release: '5.1' },
      dbClient
    );

    await expect(promise).resolves.toBe(false);
  });
});
