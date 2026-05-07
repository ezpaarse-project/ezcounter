import { vi } from 'vitest';

import type * as original from '../index';

export const getWorkByDOI = vi.fn<typeof original.getWorkByDOI>();
