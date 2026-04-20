import { vi } from 'vitest';

import type * as original from '../read';

export const findAllHarvestJob = vi.fn<typeof original.findAllHarvestJob>();

export const findManyHarvestJobById =
  vi.fn<typeof original.findManyHarvestJobById>();
