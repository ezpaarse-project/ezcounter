import { vi } from 'vitest';

import type * as original from '../create';

export const createManyHarvestJob =
  vi.fn<typeof original.createManyHarvestJob>();
