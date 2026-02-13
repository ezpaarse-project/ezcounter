import { vi } from 'vitest';

const createMockLogger = () => ({
  fatal: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
});

const createMockLoggerWithChild = () => ({
  ...createMockLogger(),
  child: vi.fn().mockReturnValue(createMockLogger()),
});

export const appLogger = createMockLoggerWithChild();

export const accessLogger = createMockLoggerWithChild();
