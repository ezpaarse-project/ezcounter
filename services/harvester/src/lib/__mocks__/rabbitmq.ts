import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { rabbitmq } from '@ezcounter/rabbitmq';

import type * as original from '../rabbitmq';

const mockedChannel = mockDeep<rabbitmq.Channel>();
const mockedConsumer = mockDeep<rabbitmq.Consumer>();
const mockedPublisher = mockDeep<rabbitmq.Publisher>();
const mockedRPC = mockDeep<rabbitmq.Consumer>();

const rabbitClient = mockDeep<rabbitmq.Connection>();
// oxlint-disable-next-line vitest/require-hook
rabbitClient.acquire.mockResolvedValue(mockedChannel);

export { type rabbitmq } from '@ezcounter/rabbitmq';

export const createConsumer = vi
  .fn<typeof original.createConsumer>()
  .mockReturnValue(mockedConsumer);

export const createPublisher = vi
  .fn<typeof original.createPublisher>()
  .mockReturnValue(mockedPublisher);

export const createRPCServer = vi
  .fn<typeof original.createRPCServer>()
  .mockReturnValue(mockedRPC);

export { rabbitClient, mockedChannel, mockedConsumer, mockedPublisher };
