import { vi } from 'vitest';

import type * as original from '../one';

export const refreshSupportedReportOfDataHost =
  vi.fn<typeof original.refreshSupportedReportOfDataHost>();
