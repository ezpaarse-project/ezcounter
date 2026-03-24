import { vi } from 'vitest';

import type * as original from '../prepare';

export const prepareHarvestJobs = vi.fn<typeof original.prepareHarvestJobs>();
