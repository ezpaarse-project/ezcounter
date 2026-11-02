import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { Model, type TransactionCreator } from '~/models/model';

import type * as original from '..';

export const mockedDataHostReleaseModel =
  mockDeep<original.DataHostReleaseModel>();

export const DataHostReleaseModel = vi.fn<typeof original.DataHostReleaseModel>(
  class MockedModel extends Model {
    static $transaction: TransactionCreator<original.DataHostReleaseModel> =
      // oxlint-disable-next-line vitest/require-mock-type-parameters
      vi.fn((executor) =>
        Promise.resolve(executor(mockedDataHostReleaseModel))
      );

    create = mockedDataHostReleaseModel.create;
    createLocal = mockedDataHostReleaseModel.createLocal;
    doesExists = mockedDataHostReleaseModel.doesExists;
    findAll = mockedDataHostReleaseModel.findAll;
    countAll = mockedDataHostReleaseModel.countAll;
    findOne = mockedDataHostReleaseModel.findOne;
    update = mockedDataHostReleaseModel.update;
    updateLocal = mockedDataHostReleaseModel.updateLocal;
    delete = mockedDataHostReleaseModel.delete;
  }
);
