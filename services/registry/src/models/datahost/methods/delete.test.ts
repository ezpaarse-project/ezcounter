import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { dbClient } from '~/lib/prisma';

import { deleteDataHost } from './delete';

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
