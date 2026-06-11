import { vi } from 'vitest';

import type * as original from '../validate';

export const validateCOUNTERReport =
  vi.fn<typeof original.validateCOUNTERReport>();
