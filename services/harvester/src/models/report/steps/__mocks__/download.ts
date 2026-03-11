import { vi } from 'vitest';

import type * as original from '../download';

export const cacheReport = vi.fn<typeof original.cacheReport>();
