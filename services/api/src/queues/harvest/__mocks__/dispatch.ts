import { vi } from 'vitest';

export const queueHarvestJobs = vi
  .fn()
  .mockImplementation((jobs: unknown): unknown => jobs);
