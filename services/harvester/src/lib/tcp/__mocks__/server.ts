import { vi } from 'vitest';

import type * as original from '../server';

export const receiveThroughTCP = vi.fn<typeof original.receiveThroughTCP>();
