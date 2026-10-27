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

    create = mockedDataHostModel.create;
    createChange = mockedDataHostModel.createChange;
    doesExists = mockedDataHostModel.doesExists;
    findAll = mockedDataHostModel.findAll;
    countAll = mockedDataHostModel.countAll;
    findOne = mockedDataHostModel.findOne;
    update = mockedDataHostModel.update;
    delete = mockedDataHostModel.delete;
  }
);
