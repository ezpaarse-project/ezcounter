import { vi } from 'vitest';

import type * as original from '../request';

export const queueHarvestRequest = vi.fn<typeof original.queueHarvestRequest>();
