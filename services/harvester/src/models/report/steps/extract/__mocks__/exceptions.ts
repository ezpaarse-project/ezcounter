import { vi } from 'vitest';

import type * as original from '../exceptions';

export const extractReportExceptions =
  vi.fn<typeof original.extractReportExceptions>();
