import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { rabbitmq } from '@ezcounter/rabbitmq';

const mockedChannel = mockDeep<rabbitmq.Channel>();
const mockedConsumer = mockDeep<rabbitmq.Consumer>();
const mockedPublisher = mockDeep<rabbitmq.Publisher>();

const rabbitClient = mockDeep<rabbitmq.Connection>();
rabbitClient.acquire.mockResolvedValue(mockedChannel);

export const createConsumer = vi.fn().mockReturnValue(mockedConsumer);

export const createPublisher = vi.fn().mockReturnValue(mockedPublisher);

export {
  rabbitClient,
  mockedChannel,
  mockedConsumer,
  mockedPublisher,
  type rabbitmq,
};
