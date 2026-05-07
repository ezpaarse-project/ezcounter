import { vi } from 'vitest';

import type * as original from '../create-buffered';

export const bufferedCreateOneCOUNTERDocument =
  vi.fn<typeof original.bufferedCreateOneCOUNTERDocument>();
