import { describe, expect, it, vi } from 'vitest';

import type { DataHostReleaseID } from '~/models/datahost-release/dto';
import type { DataHostReportID } from '~/models/datahost-report/dto';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostReleaseModel binds to a mockDeep instance
import { mockedDataHostReleaseModel } from '~/models/datahost-release/__mocks__';
// oxlint-disable-next-line vitest/no-mocks-import - mocked mockedDataHostReportModel binds to a mockDeep instance
import { mockedDataHostReportModel } from '~/models/datahost-report/__mocks__';
// oxlint-disable-next-line vitest/no-mocks-import - mocked DataHostModel binds to a mockDeep instance
import { mockedDataHostModel } from '~/models/datahost/__mocks__';

import { HTTPError } from '~/routes/v1/shared/errors';

import {
  assertDataHostRegistered,
  assertReleaseRegistered,
  assertReportRegistered,
} from './utils';

vi.mock(import('~/models/datahost'));
vi.mock(import('~/models/datahost-release'));

describe('assert if data host is registered', () => {
  it('should not throw if data host is registered', async () => {
    expect.assertions(1);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);

    const promise = assertDataHostRegistered('id');

    await expect(promise).resolves.not.toThrow();
  });

  it('should throw if data host is not registered', async () => {
    expect.assertions(3);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(false);

    const promise = assertDataHostRegistered('id');

    await expect(promise).rejects.toThrow(HTTPError);
    await expect(promise).rejects.toHaveProperty('statusCode', 404);
    await expect(promise).rejects.toThrow('Data host "id" is not registered');
  });
});

describe('assert if data host release is registered', () => {
  const id: DataHostReleaseID = {
    dataHostId: 'id',
    release: '5',
  };

  it('should not throw if release is registered', async () => {
    expect.assertions(1);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      true
    );

    const promise = assertReleaseRegistered(id);

    await expect(promise).resolves.not.toThrow();
  });

  it('should throw if data host is not registered', async () => {
    expect.assertions(3);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(false);

    const promise = assertReleaseRegistered(id);

    await expect(promise).rejects.toThrow(HTTPError);
    await expect(promise).rejects.toHaveProperty('statusCode', 404);
    await expect(promise).rejects.toThrow('Data host "id" is not registered');
  });

  it('should throw if release is not registered', async () => {
    expect.assertions(3);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      false
    );

    const promise = assertReleaseRegistered(id);

    await expect(promise).rejects.toThrow(HTTPError);
    await expect(promise).rejects.toHaveProperty('statusCode', 404);
    await expect(promise).rejects.toThrow(
      'Release "5" is not registered for data host "id"'
    );
  });
});

describe('assert if data host report is registered', () => {
  const id: DataHostReportID = {
    dataHostId: 'id',
    release: '5',
    reportId: 'report_id',
  };

  it('should not throw if report is registered', async () => {
    expect.assertions(1);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostReportModel.doesExists).mockResolvedValueOnce(true);

    const promise = assertReportRegistered(id);

    await expect(promise).resolves.not.toThrow();
  });

  it('should throw if data host release is not registered', async () => {
    expect.assertions(3);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      false
    );

    const promise = assertReportRegistered(id);

    await expect(promise).rejects.toThrow(HTTPError);
    await expect(promise).rejects.toHaveProperty('statusCode', 404);
    await expect(promise).rejects.toThrow(
      'Release "5" is not registered for data host "id"'
    );
  });

  it('should throw if data host is not registered', async () => {
    expect.assertions(3);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(false);

    const promise = assertReportRegistered(id);

    await expect(promise).rejects.toThrow(HTTPError);
    await expect(promise).rejects.toHaveProperty('statusCode', 404);
    await expect(promise).rejects.toThrow('Data host "id" is not registered');
  });

  it('should throw if report is not registered', async () => {
    expect.assertions(3);
    vi.mocked(mockedDataHostModel.doesExists).mockResolvedValueOnce(true);
    vi.mocked(mockedDataHostReleaseModel.doesExists).mockResolvedValueOnce(
      true
    );
    vi.mocked(mockedDataHostReportModel.doesExists).mockResolvedValueOnce(
      false
    );

    const promise = assertReportRegistered(id);

    await expect(promise).rejects.toThrow(HTTPError);
    await expect(promise).rejects.toHaveProperty('statusCode', 404);
    await expect(promise).rejects.toThrow(
      'Report "report_id" is not registered for release "5" of data host "id"'
    );
  });
});
