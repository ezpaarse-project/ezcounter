import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { dbClient } from '~/lib/prisma';

import { deleteSyncActivity } from './delete';

describe('delete activity for sync', () => {
  it('should query DB', async () => {
    expect.assertions(2);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    // @ts-expect-error Prisma types are complex
    vi.mocked(mockedTx.registrySyncActivity.count).mockResolvedValueOnce({
      id: 1,
    });

    await deleteSyncActivity('sync-id', dbClient);

    expect(dbClient.$transaction).toHaveBeenCalledOnce();
    expect(
      mockedTx.registrySyncActivity.delete
    ).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: 'sync-id',
      },
    });
  });

  it('should return if deleted', async () => {
    expect.assertions(1);
    const mockedTx = mockDeep<typeof dbClient>();
    vi.mocked(dbClient.$transaction).mockImplementationOnce((exec) =>
      exec(mockedTx)
    );

    vi.mocked(mockedTx.registrySyncActivity.count).mockResolvedValueOnce(0);

    const promise = deleteSyncActivity('sync-id', dbClient);

    await expect(promise).resolves.toBe(false);
  });
});
