import { type BulkIndexResult, esBulkIndex } from '~/lib/elasticsearch';
import { appLogger } from '~/lib/logger';

import type { CreateCOUNTERDocument } from '../dto';

const logger = appLogger.child({ model: 'counter-document', scope: 'models' });

type CreateManyPayload = {
  id: string;
  index: string;
  document: CreateCOUNTERDocument & Record<string, unknown>;
};

/**
 * Create many COUNTER document
 *
 * @param data - The data to insert, allows for additional properties
 *
 * @returns Which items where created or updated
 */
export async function createManyCOUNTERDocument(
  data: CreateManyPayload[]
): Promise<BulkIndexResult> {
  try {
    const result = await esBulkIndex(
      data.map(({ id, index, document }) => ({
        action: { _id: id, _index: index },
        document,
      }))
    );

    logger.debug({
      count: data.length,
      created: result.created.length,
      errors: result.errors.length,
      msg: 'Created COUNTER documents',
      updated: result.updated.length,
    });

    return result;
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unable to create COUNTER documents',
    });

    return {
      created: [],
      errors: [error instanceof Error ? error : new Error(`${error}`)],
      updated: [],
    };
  }
}
