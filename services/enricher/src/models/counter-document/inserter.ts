import EventEmitter from 'node:events';

import { createThrottledFunction } from '@ezcounter/toolbox/utils';

import {
  type BulkIndexOperation,
  type BulkIndexResult,
  esBulkIndex,
} from '~/lib/elasticsearch';
import { appLogger } from '~/lib/logger';

import type { CreateCOUNTERDocument } from './dto';

const logger = appLogger.child({ model: 'counter-document', scope: 'models' });

const INSERT_THROTTLE = 250;
const MAX_BUFFER_SIZE = 1000;

type InserterEvents = {
  /* Triggered when inserting succeed */
  'insert:ok': [BulkIndexResult];
  /* Triggered when insert fails */
  'insert:error': [Error];
};

export class CounterDocumentInserter {
  private buffer: BulkIndexOperation[] = [];

  private bus = new EventEmitter<InserterEvents>();

  private error: Error | null = null;

  private insert = createThrottledFunction(async (): Promise<void> => {
    const items = [...this.buffer];
    this.buffer.length = 0;

    try {
      const result = await esBulkIndex(items);

      logger.debug({
        count: this.buffer.length,
        created: result.created,
        errors: result.errors.length,
        msg: 'Created COUNTER documents',
        updated: result.updated,
      });

      this.bus.emit('insert:ok', result);
    } catch (error) {
      logger.error({
        err: error,
        msg: 'Unable to create COUNTER documents',
      });

      const err = error instanceof Error ? error : new Error(`${error}`);
      this.error = err;
      this.bus.emit('insert:error', err);
    }
  }, INSERT_THROTTLE);

  constructor(onCreate?: (data: BulkIndexResult) => void) {
    if (onCreate) {
      this.bus.on('insert:ok', onCreate);
    }
  }

  /**
   * Create one COUNTER document but throttled to bulk requests
   *
   * @param data - The data to insert, needs id of document and target index, allows for additional properties
   *
   * @returns Promise that resolves when writing to the buffer succeed
   */
  public async createOneCOUNTERDocument(
    data: CreateCOUNTERDocument & {
      _id: string;
      _index: string;
      [k: string]: unknown;
    }
  ): Promise<void> {
    if (this.error) {
      throw this.error;
    }

    const { _id, _index, ...document } = data;

    this.buffer.push({
      action: { _id, _index },
      document,
    });

    const promise = this.insert();

    // Wait for next insert before allowing more writes
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      await promise;
    }
  }

  /**
   * Waits for insertion completion
   */
  public async waitLastDocumentCreation(): Promise<void> {
    if (this.error) {
      throw this.error;
    }

    if (this.buffer.length <= 0) {
      return;
    }

    // oxlint-disable-next-line promise/avoid-new
    await new Promise<void>((resolve, reject) => {
      this.bus.once('insert:ok', () => resolve());
      this.bus.once('insert:error', (error) => reject(error));
    });
  }
}
