import { vi } from 'vitest';

import type * as original from '../context';

export const resolveRequestContextPerHostname =
  vi.fn<typeof original.resolveRequestContextPerHostname>();
