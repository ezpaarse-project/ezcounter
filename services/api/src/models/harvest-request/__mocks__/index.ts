import { vi } from 'vitest';

import type * as original from '../index';

export const prepareHarvestJobsFromHarvestRequest =
  vi.fn<typeof original.prepareHarvestJobsFromHarvestRequest>();
