import { vi } from 'vitest';

import type * as original from '../index';

export const enrichItemUsingOpenAlex =
  vi.fn<typeof original.enrichItemUsingOpenAlex>();
