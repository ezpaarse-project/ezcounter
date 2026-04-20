import { vi } from 'vitest';

import type * as original from '../update-throttled';

export const updateOneHarvestJobThrottled =
  vi.fn<typeof original.updateOneHarvestJobThrottled>();
