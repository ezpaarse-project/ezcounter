import { vi } from 'vitest';

import type * as original from '../documents';

export const bufferedFetchOneDocumentByDOI =
  vi.fn<typeof original.bufferedFetchOneDocumentByDOI>();
