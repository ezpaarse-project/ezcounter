import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { Model, type TransactionCreator } from '~/models/model';

import type * as original from '..';

export const mockedSyncActivityModel = mockDeep<original.SyncActivityModel>();

export const SyncActivityModel = vi.fn<typeof original.SyncActivityModel>(
  class MockedModel extends Model {
    static $transaction: TransactionCreator<original.SyncActivityModel> =
      // oxlint-disable-next-line vitest/require-mock-type-parameters
      vi.fn((executor) => Promise.resolve(executor(mockedSyncActivityModel)));

    create = mockedSyncActivityModel.create;
    createHostAction = mockedSyncActivityModel.createHostAction;
    doesExists = mockedSyncActivityModel.doesExists;
    findAll = mockedSyncActivityModel.findAll;
    countAll = mockedSyncActivityModel.countAll;
    findOne = mockedSyncActivityModel.findOne;
    update = mockedSyncActivityModel.update;
    addDiffToHostActive = mockedSyncActivityModel.addDiffToHostActive;
    delete = mockedSyncActivityModel.delete;
  }
);
