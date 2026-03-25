import { vi } from 'vitest';

import type * as original from '../many';

export const refreshManySupportedReports =
  vi.fn<typeof original.refreshManySupportedReports>();
