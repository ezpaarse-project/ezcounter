import { afterEach, beforeEach, vi } from 'vitest';

// Mocking config
vi.mock(import('~/lib/config'));
// Mocking logger
vi.mock(import('~/lib/logger'));
// Mocking RabbitMQ
vi.mock(import('~/lib/rabbitmq'));
// Mocking ElasticSearch
vi.mock(import('~/lib/elasticsearch'));
// Mocking Redis
vi.mock(import('~/lib/keyv'));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
