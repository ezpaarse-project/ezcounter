import { vi } from 'vitest';

import type * as original from '..';

export const findAllHarvestJob = vi.fn<typeof original.findAllHarvestJob>();

export const findManyHarvestJobById =
  vi.fn<typeof original.findManyHarvestJobById>();

export const createManyHarvestJob =
  vi.fn<typeof original.createManyHarvestJob>();

export const updateOneHarvestJob = vi.fn<typeof original.updateOneHarvestJob>();

export const failManyHarvestJob = vi.fn<typeof original.failManyHarvestJob>();
