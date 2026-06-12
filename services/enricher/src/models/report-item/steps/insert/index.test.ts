import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent, EnrichJobData } from '@ezcounter/dto/queues';

import type { CreateCOUNTERDocument } from '~/models/counter-document/dto';
import { bufferedCreateOneCOUNTERDocument } from '~/models/counter-document';

import { sendEnrichJobStatusEvent } from '~/queues/enrich/status';

import { insertReportItem } from '.';
import { transformReportItemToDocuments } from './transform';

vi.mock(import('~/queues/enrich/status'));
vi.mock(import('~/models/counter-document'));
vi.mock(import('./transform'));

describe('Insert report item (insertReportItem)', () => {
  const job: EnrichJobData = {
    data: mockDeep<EnrichJobContent>(),
    enrich: {
      results: { X_Enrich_Result: true },
    },
    id: 'job-id',
    insert: {
      additionalData: { X_Unit_Test: true },
      index: 'z-index',
    },
  };

  test('should mark job as processing', async () => {
    await insertReportItem(job);

    expect(sendEnrichJobStatusEvent).toHaveBeenCalledExactlyOnceWith({
      id: 'job-id',
      status: 'processing',
    });
  });

  test('should transform item with provided options', async () => {
    await insertReportItem(job);

    expect(transformReportItemToDocuments).toHaveBeenCalledWith(
      job.data,
      job.insert
    );
  });

  test('should add to COUNTER document buffer with additional data', async () => {
    // Generate some mocked documents
    vi.mocked(transformReportItemToDocuments).mockImplementationOnce(
      function* generate() {
        yield { document: mockDeep<CreateCOUNTERDocument>(), id: 'doc-id' };
      }
    );

    await insertReportItem(job);

    expect(bufferedCreateOneCOUNTERDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        document: expect.objectContaining({
          X_Enrich_Result: true,
          X_Unit_Test: true,
        }),
        id: 'doc-id',
        index: 'z-index',
      })
    );
  });

  test('should notify about progress once per item', async () => {
    // Generate some mocked documents
    vi.mocked(transformReportItemToDocuments).mockImplementationOnce(
      function* generate() {
        const document1 = mockDeep<CreateCOUNTERDocument>();
        document1.X_Date_Month = '2025-01';
        yield { document: document1, id: 'doc-1' };

        const document2 = mockDeep<CreateCOUNTERDocument>();
        document2.X_Date_Month = '2025-02';
        yield { document: document2, id: 'doc-2' };

        const document3 = mockDeep<CreateCOUNTERDocument>();
        document3.X_Date_Month = '2025-01';
        yield { document: document3, id: 'doc-3' };
      }
    );

    // Mock some insertion
    vi.mocked(bufferedCreateOneCOUNTERDocument).mockImplementationOnce(
      (payload) => {
        payload.onCreated?.('created');
        return Promise.resolve();
      }
    );
    vi.mocked(bufferedCreateOneCOUNTERDocument).mockImplementationOnce(
      (payload) => {
        payload.onCreated?.('updated');
        return Promise.resolve();
      }
    );
    vi.mocked(bufferedCreateOneCOUNTERDocument).mockImplementationOnce(
      (payload) => {
        payload.onCreated?.('created');
        return Promise.resolve();
      }
    );

    await insertReportItem(job);

    // Wait for debounce to resolve
    await vi.runAllTimersAsync();
    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'job-id',
        insert: {
          coveredMonths: ['2025-01', '2025-02'],
          created: 2,
          items: 1,
          status: 'processing',
          updated: 1,
        },
      })
    );
  });

  test('should NOT notify about progress if document is not inserted', async () => {
    // Generate some mocked documents
    vi.mocked(transformReportItemToDocuments).mockImplementationOnce(
      function* generate() {
        yield { document: mockDeep<CreateCOUNTERDocument>(), id: 'doc-1' };
      }
    );

    // Mock some insertion
    vi.mocked(bufferedCreateOneCOUNTERDocument).mockImplementationOnce(
      (payload) => {
        payload.onCreated?.(null);
        return Promise.resolve();
      }
    );

    await insertReportItem(job);

    // Wait for debounce to resolve
    await vi.runAllTimersAsync();
    // 1 for initial status
    expect(sendEnrichJobStatusEvent).toHaveBeenCalledOnce();
  });

  test('should notify about error', async () => {
    // Generate some mocked documents
    vi.mocked(transformReportItemToDocuments).mockImplementationOnce(
      function* generate() {
        yield { document: mockDeep<CreateCOUNTERDocument>(), id: 'doc-id' };
      }
    );

    vi.mocked(bufferedCreateOneCOUNTERDocument).mockRejectedValueOnce(
      new Error('Insert error')
    );

    await insertReportItem(job);

    expect(sendEnrichJobStatusEvent).toHaveBeenLastCalledWith({
      error: expect.objectContaining({
        message: 'Insert error',
      }),
      id: 'job-id',
      status: 'error',
    });
  });
});
