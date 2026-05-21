import { vi } from 'vitest';

import type * as original from '../pub';

export const queueEnrichJob = vi.fn<typeof original.queueEnrichJob>();
