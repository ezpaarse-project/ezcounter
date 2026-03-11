import { vi } from 'vitest';

import * as original from '..';

export const findAllHarvestJob = vi.fn<typeof original.findAllHarvestJob>();

export const findManyHarvestJobById =
  vi.fn<typeof original.findManyHarvestJobById>();

export const createManyHarvestJob =
  vi.fn<typeof original.createManyHarvestJob>();

export const failManyHarvestJob = vi.fn<typeof original.failManyHarvestJob>();

export const splitPeriodByMonths = vi.fn(original.splitPeriodByMonths);
