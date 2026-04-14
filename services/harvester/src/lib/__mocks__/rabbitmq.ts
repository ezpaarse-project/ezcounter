import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { rabbitmq } from '@ezcounter/rabbitmq';

const rabbitClient = mockDeep<rabbitmq.Connection>();
const mockedChannel = mockDeep<rabbitmq.Channel>();
rabbitClient.acquire.mockResolvedValue(mockedChannel);

const mockedConsumer = mockDeep<rabbitmq.Consumer>();
const createConsumer = vi.fn().mockReturnValue(mockedConsumer);

const mockedPublisher = mockDeep<rabbitmq.Publisher>();
const createPublisher = vi.fn().mockReturnValue(mockedPublisher);

export {
  rabbitClient,
  mockedChannel,
  mockedConsumer,
  createConsumer,
  mockedPublisher,
  createPublisher,
  type rabbitmq,
};
