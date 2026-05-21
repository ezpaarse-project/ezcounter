import { vi } from 'vitest';

import type * as original from '../r5';

export const transformR5ItemToDocuments = vi.fn<
  typeof original.transformR5ItemToDocuments
>(
  // oxlint-disable-next-line no-empty-function
  function* dummy() {}
);
