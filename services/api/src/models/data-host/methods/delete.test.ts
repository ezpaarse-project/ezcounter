import { describe, expect, test } from 'vitest';

import { dbClient } from '~/lib/__mocks__/prisma';

import {
  deleteDataHost,
  deleteReleaseSupportedByDataHost,
  deleteReportSupportedByDataHost,
} from './delete';

describe(deleteDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHost.count.mockResolvedValueOnce(1);

    await deleteDataHost('id');

    expect(dbClient.dataHost.delete).toBeCalled();
  });

  test('should return if deleted', async () => {
    dbClient.dataHost.count.mockResolvedValueOnce(0);

    const promise = deleteDataHost('id');

    await expect(promise).resolves.toBe(false);
  });
});

describe(deleteReleaseSupportedByDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(1);

    await deleteReleaseSupportedByDataHost('id', '5.1');

    expect(dbClient.dataHostSupportedRelease.delete).toBeCalled();
  });

  test('should return if deleted', async () => {
    dbClient.dataHostSupportedRelease.count.mockResolvedValueOnce(0);

    const promise = deleteReleaseSupportedByDataHost('id', '5.1');

    await expect(promise).resolves.toBe(false);
  });
});

describe(deleteReportSupportedByDataHost, () => {
  test('should query DB', async () => {
    dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(1);

    await deleteReportSupportedByDataHost('id', '5.1', 'tr');

    expect(dbClient.dataHostSupportedReport.delete).toBeCalled();
  });

  test('should return if deleted', async () => {
    dbClient.dataHostSupportedReport.count.mockResolvedValueOnce(0);

    const promise = deleteReportSupportedByDataHost('id', '5.1', 'tr');

    await expect(promise).resolves.toBe(false);
  });
});
