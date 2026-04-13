import { vi } from 'vitest';

import type * as original from '../refresh';

export const refreshSupportedReportsOfDataHost =
  vi.fn<typeof original.refreshSupportedReportsOfDataHost>();
