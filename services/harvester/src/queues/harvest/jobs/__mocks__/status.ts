import { vi } from 'vitest';

import type * as original from '../status';

export const sendHarvestJobStatusEvent =
  vi.fn<typeof original.sendHarvestJobStatusEvent>();
