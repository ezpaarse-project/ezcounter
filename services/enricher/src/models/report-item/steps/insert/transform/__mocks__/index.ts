import { vi } from 'vitest';

import type * as original from '..';

export const transformReportItemToDocuments = vi.fn<
  typeof original.transformReportItemToDocuments
>(
  // oxlint-disable-next-line no-empty-function
  function* dummy() {}
);
