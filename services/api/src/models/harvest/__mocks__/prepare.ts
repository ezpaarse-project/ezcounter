import { vi } from 'vitest';

import type * as original from '../prepare';

export const prepareHarvestJobsFromHarvestRequestContent =
  vi.fn<typeof original.prepareHarvestJobsFromHarvestRequestContent>();

export const prepareHarvestJobsFromHarvestRequest =
  vi.fn<typeof original.prepareHarvestJobsFromHarvestRequest>();
