import { vi } from 'vitest';

import type * as original from '..';

export const extractReportItems = vi.fn<typeof original.extractReportItems>(
  // oxlint-disable-next-line no-empty-function
  async function* dummy() {}
);
