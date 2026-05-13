import { vi } from 'vitest';

import type * as original from '../supported-reports';

export const fetchSupportedReportsOfDataHost =
  vi.fn<typeof original.fetchSupportedReportsOfDataHost>();
