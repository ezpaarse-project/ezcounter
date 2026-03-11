import { vi } from 'vitest';

import type * as original from '..';

export const harvestReport = vi.fn<typeof original.harvestReport>();
