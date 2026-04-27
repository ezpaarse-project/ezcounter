import { setTimeout } from 'node:timers/promises';

import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { esBulkIndex } from '~/lib/__mocks__/elasticsearch';

import type { CreateCOUNTERDocument } from './dto';
import { CounterDocumentInserter } from './inserter';

describe('COUNTER Document insert (CounterDocumentInserter)', () => {
  describe('Throttled insert (createOneCOUNTERDocument)', () => {
    const document = mockDeep<CreateCOUNTERDocument>();

    it('should index in bulk', async () => {
      esBulkIndex.mockResolvedValueOnce({ created: 0, errors: [], updated: 0 });

      const docs = new CounterDocumentInserter();

      await docs.createOneCOUNTERDocument({ ...document, _id: '', _index: '' });

      await vi.runAllTimersAsync();
      expect(esBulkIndex).toHaveBeenCalled();
    });

    it('should group documents in buffer before inserting', async () => {
      esBulkIndex.mockResolvedValueOnce({ created: 0, errors: [], updated: 0 });

      const docs = new CounterDocumentInserter();

      await Promise.all(
        Array.from({ length: 5 }, (__, index) =>
          docs.createOneCOUNTERDocument({
            ...document,
            _id: `${index}`,
            _index: '',
          })
        )
      );

      await vi.runAllTimersAsync();
      expect(esBulkIndex).toHaveBeenCalledExactlyOnceWith([
        { action: { _id: '0', _index: '' }, document: { ...document } },
        { action: { _id: '1', _index: '' }, document: { ...document } },
        { action: { _id: '2', _index: '' }, document: { ...document } },
        { action: { _id: '3', _index: '' }, document: { ...document } },
        { action: { _id: '4', _index: '' }, document: { ...document } },
      ]);
    });

    it('should wait if buffer is full', async () => {
      const MAX_BUFFER_SIZE = 1000;
      esBulkIndex.mockImplementationOnce(async () => {
        await setTimeout(100);
        return { created: 0, errors: [], updated: 0 };
      });

      const docs = new CounterDocumentInserter();
      const spy = vi.fn<typeof docs.createOneCOUNTERDocument>((...args) =>
        docs.createOneCOUNTERDocument(...args)
      );

      for (let index = 0; index < MAX_BUFFER_SIZE + 1; index += 1) {
        void spy({
          ...document,
          _id: `${index}`,
          _index: '',
        });

        // If buffer is not full, no async is used so it should be less than 1ms
        // oxlint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(1);
        if (index > MAX_BUFFER_SIZE) {
          expect(spy).not.toHaveResolved();
        }
        spy.mockClear();
      }

      await vi.runAllTimersAsync();
    });

    it('should throw if one of the insertion failed', async () => {
      esBulkIndex.mockRejectedValueOnce(new Error('Insert error'));

      const docs = new CounterDocumentInserter();

      await docs.createOneCOUNTERDocument({
        ...document,
        _id: `0`,
        _index: '',
      });

      // Let throttle start inserting, rejecting
      await vi.runAllTimersAsync();

      const promise = docs.createOneCOUNTERDocument({
        ...document,
        _id: `1`,
        _index: '',
      });

      await expect(promise).rejects.toThrow('Insert error');
    });
  });

  describe('Wait for insert (waitLastDocumentCreation)', () => {
    const document = mockDeep<CreateCOUNTERDocument>();

    it('should throw if one of the insertion failed before', async () => {
      esBulkIndex.mockRejectedValueOnce(new Error('Insert error'));

      const docs = new CounterDocumentInserter();

      await docs.createOneCOUNTERDocument({
        ...document,
        _id: `0`,
        _index: '',
      });

      // Let throttle start inserting, rejecting
      await vi.runAllTimersAsync();

      const promise = docs.waitLastDocumentCreation();

      await expect(promise).rejects.toThrow('Insert error');
    });

    it('should throw if pending insertion failed', async () => {
      esBulkIndex.mockImplementationOnce(async () => {
        await setTimeout(100);
        throw new Error('Insert error');
      });

      const docs = new CounterDocumentInserter();

      // Putting documents in buffer
      await docs.createOneCOUNTERDocument({
        ...document,
        _id: `0`,
        _index: '',
      });
      await docs.createOneCOUNTERDocument({
        ...document,
        _id: `1`,
        _index: '',
      });

      const promise = docs.waitLastDocumentCreation();

      // Let throttle start inserting, rejecting
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Insert error');
    });

    it('should resolve immediately if buffer is empty', async () => {
      const docs = new CounterDocumentInserter();
      const spy = vi.fn<typeof docs.waitLastDocumentCreation>(() =>
        docs.waitLastDocumentCreation()
      );

      void spy();
      // No async is used so it should be less than 1ms
      await vi.advanceTimersByTimeAsync(1);

      expect(spy).toHaveResolved();
    });
  });

  describe('Listen for insertions (constructor.onCreate)', () => {
    const document = mockDeep<CreateCOUNTERDocument>();

    it('should be called after insertion', async () => {
      const result = { created: 0, errors: [], updated: 0 };
      esBulkIndex.mockResolvedValueOnce(result);

      const spy = vi.fn();
      const docs = new CounterDocumentInserter(spy);

      await docs.createOneCOUNTERDocument({ ...document, _id: '', _index: '' });

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledExactlyOnceWith(result);
    });

    it('should NOT be called after error', async () => {
      esBulkIndex.mockRejectedValueOnce(new Error('Insert error'));

      const spy = vi.fn();
      const docs = new CounterDocumentInserter(spy);

      await docs.createOneCOUNTERDocument({ ...document, _id: '', _index: '' });

      await vi.runAllTimersAsync();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
