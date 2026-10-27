import type { Prisma } from '@ezcounter/database';

import { dbClient } from '~/lib/prisma';

type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

export abstract class Model {
  /**
   * DB client, can be a transaction
   */
  protected db: Prisma.TransactionClient;

  /**
   * Create a new model with a prisma client
   *
   * @param clientOrModel Prisma instance or service.
   * Default to global prisma instance, if a model is provided it'll reuse the prisma instance
   * and transaction
   */
  constructor(clientOrModel?: Prisma.TransactionClient | Model) {
    if (clientOrModel instanceof Model) {
      this.db = clientOrModel.db;
      return;
    }

    this.db = clientOrModel ?? dbClient;
  }
}

/**
 * Type for the transaction creator of models
 */
export type TransactionCreator<ModelType extends Model> = <Result>(
  executor: (model: ModelType) => Promise<Result>,
  options?: TransactionOptions
) => Promise<Result>;

/**
 * Setup Model transactions creator
 *
 * @param Ctor - The current model
 *
 * @returns The transaction creator
 */
export const createModelTransaction =
  <ModelType extends Model>(
    Ctor: new (tx: Prisma.TransactionClient) => ModelType
  ): TransactionCreator<ModelType> =>
  (executor, options) => {
    const currentTransaction = dbClient.$transaction((tx) => {
      const model = new Ctor(tx);

      return executor(model);
    }, options);

    return currentTransaction;
  };
