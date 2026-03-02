import { vi } from 'vitest';

import { splitPeriodByMonths as originalSsplitPeriodByMonths } from '..';

export const findAllHarvestJob = vi.fn();

export const findManyHarvestJobById = vi.fn();

export const createManyHarvestJob = vi.fn();

export const failManyHarvestJob = vi.fn();

export const splitPeriodByMonths = vi.fn(originalSsplitPeriodByMonths);
