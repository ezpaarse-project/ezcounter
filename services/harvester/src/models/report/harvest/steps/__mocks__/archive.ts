import { vi } from 'vitest';

import type * as original from '../archive';

export const archiveReport = vi.fn<typeof original.archiveReport>();
