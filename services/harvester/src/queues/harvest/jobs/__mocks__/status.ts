import { vi } from 'vitest';

import type { sendHarvestJobStatusEvent as originalSendHarvestJobStatusEvent } from '../status';

export const sendHarvestJobStatusEvent =
  vi.fn<typeof originalSendHarvestJobStatusEvent>();
