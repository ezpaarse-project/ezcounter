import { vi } from 'vitest';

import type * as original from '../works';

export const bufferedFetchOneWorkByDOI =
  vi.fn<typeof original.bufferedFetchOneWorkByDOI>();
