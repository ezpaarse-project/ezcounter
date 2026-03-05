import { vi } from 'vitest';

import type { extractReportExceptions as originalExtractReportExceptions } from '../exceptions';

export const extractReportExceptions =
  vi.fn<typeof originalExtractReportExceptions>();
