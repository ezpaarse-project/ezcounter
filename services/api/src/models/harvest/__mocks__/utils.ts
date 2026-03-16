import { vi } from 'vitest';

import type * as original from '../utils';

export const prepareHarvestJobs = vi.fn<typeof original.prepareHarvestJobs>();
