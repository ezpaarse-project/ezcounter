import { vi } from 'vitest';

import type * as original from '../status';

export const sendEnrichJobStatusEvent =
  vi.fn<typeof original.sendEnrichJobStatusEvent>();
