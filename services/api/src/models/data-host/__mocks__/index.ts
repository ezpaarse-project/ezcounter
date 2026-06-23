import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { Model, type TransactionCreator } from '~/models/model';

import type * as original from '..';

export const mockedDataHostModel = mockDeep<original.DataHostModel>();

export const DataHostModel = vi.fn<typeof original.DataHostModel>(
  class MockedModel extends Model {
    // oxlint-disable-next-line vitest/require-mock-type-parameters
    static $transaction: TransactionCreator<original.DataHostModel> = vi.fn(
      (executor) => Promise.resolve(executor(mockedDataHostModel))
    );

    upsert = mockedDataHostModel.upsert;
    upsertReleaseSupported = mockedDataHostModel.upsertReleaseSupported;
    upsertReportSupported = mockedDataHostModel.upsertReportSupported;
    doesExists = mockedDataHostModel.doesExists;
    findAll = mockedDataHostModel.findAll;
    countAll = mockedDataHostModel.countAll;
    findOne = mockedDataHostModel.findOne;
    doesSupportsRelease = mockedDataHostModel.doesSupportsRelease;
    findAllReleasesSupported = mockedDataHostModel.findAllReleasesSupported;
    countAllReleasesSupported = mockedDataHostModel.countAllReleasesSupported;
    findOneReleaseSupported = mockedDataHostModel.findOneReleaseSupported;
    doesSupportsReport = mockedDataHostModel.doesSupportsReport;
    findAllReportsSupported = mockedDataHostModel.findAllReportsSupported;
    countAllReportsSupported = mockedDataHostModel.countAllReportsSupported;
    findOneReportSupported = mockedDataHostModel.findOneReportSupported;
    findOneWithSupportedData = mockedDataHostModel.findOneWithSupportedData;
    delete = mockedDataHostModel.delete;
    deleteReleaseSupported = mockedDataHostModel.deleteReleaseSupported;
    deleteReportSupported = mockedDataHostModel.deleteReportSupported;
  }
);
