import { vi } from 'vitest';

import type * as original from '../refresh';

export const processRefreshQueue = vi.fn<typeof original.processRefreshQueue>(
  // oxlint-disable-next-line no-empty-function
  async function* dummy() {}
);

export const queueDataHostRefresh =
  vi.fn<typeof original.queueDataHostRefresh>();
