import { vi } from 'vitest';

import type { cacheReport as originalCacheReport } from '../download';

export const cacheReport = vi.fn<typeof originalCacheReport>();
