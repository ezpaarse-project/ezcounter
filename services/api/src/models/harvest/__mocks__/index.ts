import { vi } from 'vitest';

import type * as original from '..';

// READ

export const findAllHarvestJob = vi.fn<typeof original.findAllHarvestJob>();

export const findManyHarvestJobById =
  vi.fn<typeof original.findManyHarvestJobById>();

// CREATE

export const createManyHarvestJob =
  vi.fn<typeof original.createManyHarvestJob>();

// UPDATE

export const updateOneHarvestJob = vi.fn<typeof original.updateOneHarvestJob>();

export const failManyHarvestJob = vi.fn<typeof original.failManyHarvestJob>();
