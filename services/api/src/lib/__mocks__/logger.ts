import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { Logger } from '@ezcounter/logger';

const createMockLoggerWithChild = () => ({
  ...mockDeep<Logger>(),
  child: vi.fn().mockReturnValue(mockDeep<Logger>()),
});

export const appLogger = createMockLoggerWithChild();

export const accessLogger = createMockLoggerWithChild();
