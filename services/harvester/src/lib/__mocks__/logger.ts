import { vi } from 'vitest';

const createMockLogger = () => ({
  child: vi.fn().mockReturnValue({
    debug: vi.fn(),
  }),
});

export const appLogger = createMockLogger();

export const accessLogger = createMockLogger();
