import { describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { EnrichJobContent } from '@ezcounter/dto/queues';
import { EnrichSource } from '@ezcounter/dto/enrich';

// oxlint-disable-next-line vitest/no-mocks-import - We need to get mockedPublisher as pub is not exported
import { mockedPublisher } from '~/lib/__mocks__/rabbitmq';

import { queueEnrichJob } from './pub';

describe('queue Enrich Job', () => {
  it('should queue with next source as routingKey', async () => {
    expect.hasAssertions();
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

  it('should queue with _insert if no sources left', async () => {
    expect.hasAssertions();
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

  it('should queue with first key if no sources are defined', async () => {
    expect.hasAssertions();
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

  it('should NOT throw if queue fails', async () => {
    expect.hasAssertions();
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
