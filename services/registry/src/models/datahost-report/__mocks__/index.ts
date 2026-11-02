import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { Model, type TransactionCreator } from '~/models/model';

import type * as original from '..';

export const mockedDataHostReportModel =
  mockDeep<original.DataHostReportModel>();

export const DataHostReportModel = vi.fn<typeof original.DataHostReportModel>(
  class MockedModel extends Model {
    static $transaction: TransactionCreator<original.DataHostReportModel> =
      // oxlint-disable-next-line vitest/require-mock-type-parameters
      vi.fn((executor) => Promise.resolve(executor(mockedDataHostReportModel)));

    create = mockedDataHostReportModel.create;
    createLocal = mockedDataHostReportModel.createLocal;
    doesExists = mockedDataHostReportModel.doesExists;
    findAll = mockedDataHostReportModel.findAll;
    countAll = mockedDataHostReportModel.countAll;
    findOne = mockedDataHostReportModel.findOne;
    update = mockedDataHostReportModel.update;
    updateLocal = mockedDataHostReportModel.updateLocal;
    delete = mockedDataHostReportModel.delete;
  }
);
