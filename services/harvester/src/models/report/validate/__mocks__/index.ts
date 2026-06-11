import { vi } from 'vitest';

import type * as original from '..';

export const validateReport = vi.fn<typeof original.validateReport>();
