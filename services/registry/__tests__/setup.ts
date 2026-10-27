import { afterEach, beforeEach, vi } from 'vitest';

// Mocking config
vi.mock(import('~/lib/config'));
// Mocking logger
vi.mock(import('~/lib/logger'));
// Mocking DB
vi.mock(import('~/lib/prisma'));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
