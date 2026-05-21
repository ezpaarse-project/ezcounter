import { vi } from 'vitest';

import type * as original from '../r51';

export const transformR51ItemToDocuments = vi.fn<
  typeof original.transformR51ItemToDocuments
>(
  // oxlint-disable-next-line no-empty-function
  function* dummy() {}
);
