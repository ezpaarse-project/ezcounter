import { describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent } from '@ezcounter/dto/queues';
import { EnrichSource } from '@ezcounter/dto/enrich';

import { mockedPublisher } from '~/lib/__mocks__/rabbitmq';

import { queueEnrichJob } from './pub';

describe('Queue Enrich Job (queueEnrichJob)', () => {
  test('should queue with next source as routingKey', async () => {
    await queueEnrichJob({
      data: mockDeep<EnrichJobContent>(),
      enrich: {
        sources: ['openalex'],
      },
      id: 'foobar',
      insert: { index: 'z-index' },
    });

    expect(mockedPublisher.send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        routingKey: 'openalex',
      }),
      expect.objectContaining({
        enrich: expect.objectContaining({
          sources: [],
        }),
        id: 'foobar',
      })
    );
  });

  test('should queue with _insert if no sources left', async () => {
    await queueEnrichJob({
      data: mockDeep<EnrichJobContent>(),
      enrich: {
        sources: [],
      },
      id: 'foobar',
      insert: { index: 'z-index' },
    });

    expect(mockedPublisher.send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        routingKey: '_insert',
      }),
      expect.objectContaining({
        id: 'foobar',
      })
    );
  });

  test('should queue with first key if no sources are defined', async () => {
    await queueEnrichJob({
      data: mockDeep<EnrichJobContent>(),
      enrich: {},
      id: 'foobar',
      insert: { index: 'z-index' },
    });

    expect(mockedPublisher.send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        routingKey: Object.keys(EnrichSource.enum)[0],
      }),
      expect.objectContaining({
        id: 'foobar',
      })
    );
  });

  test('should NOT throw if queue fails', async () => {
    mockedPublisher.send.mockRejectedValueOnce(new Error('Send error'));

    const promise = queueEnrichJob({
      data: mockDeep<EnrichJobContent>(),
      enrich: {
        sources: [],
      },
      id: 'foobar',
      insert: { index: 'z-index' },
    });

    await expect(promise).resolves.not.toThrow();
  });
});
