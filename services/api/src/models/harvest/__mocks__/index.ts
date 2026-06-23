import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { Model, type TransactionCreator } from '~/models/model';

import type * as original from '..';

export const mockedHarvestJobModel = mockDeep<original.HarvestJobModel>();

export const HarvestJobModel = vi.fn<typeof original.HarvestJobModel>(
  class MockedModel extends Model {
    // oxlint-disable-next-line vitest/require-mock-type-parameters
    static $transaction: TransactionCreator<original.HarvestJobModel> = vi.fn(
      (executor) => Promise.resolve(executor(mockedHarvestJobModel))
    );

    createMany = mockedHarvestJobModel.createMany;
    findAll = mockedHarvestJobModel.findAll;
    countAll = mockedHarvestJobModel.countAll;
    findManyById = mockedHarvestJobModel.findManyById;
    updateOne = mockedHarvestJobModel.updateOne;
    updateOneThrottled = mockedHarvestJobModel.updateOneThrottled;
    failMany = mockedHarvestJobModel.failMany;
  }
);
