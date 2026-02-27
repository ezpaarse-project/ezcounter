import { vi } from 'vitest';

// Mocking config
vi.mock(import('~/lib/config'));
// Mocking logger
vi.mock(import('~/lib/logger'));
// Mocking DB
vi.mock(import('~/lib/prisma'));
