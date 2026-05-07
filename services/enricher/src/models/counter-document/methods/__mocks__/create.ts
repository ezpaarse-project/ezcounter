import { vi } from 'vitest';

import type * as original from '../create';

export const createManyCOUNTERDocument =
  vi.fn<typeof original.createManyCOUNTERDocument>();
