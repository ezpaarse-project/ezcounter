import { vi } from 'vitest';

import type * as original from '../update';

export const updateOneHarvestJob = vi.fn<typeof original.updateOneHarvestJob>();

export const failManyHarvestJob = vi.fn<typeof original.failManyHarvestJob>();
