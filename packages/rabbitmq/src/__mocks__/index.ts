import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type * as original from '..';

export const rabbitmq = mockDeep<typeof original.rabbitmq>();

export const sendJSONMessage = vi
  .fn<typeof original.sendJSONMessage>()
  .mockReturnValue({
    sent: false,
    size: 0,
  });

export const parseJSONMessage = vi.fn<typeof original.parseJSONMessage>(
  ({ content }) => {
    const raw = content.toString();
    return { data: JSON.parse(raw), raw };
  }
);

export const consumeJSONQueue = vi.fn<typeof original.consumeJSONQueue>();

export const setupRabbitMQ = vi.fn<typeof original.setupRabbitMQ>();
