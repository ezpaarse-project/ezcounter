import { vi } from 'vitest';

import type { archiveReport as originalArchiveReport } from '../archive';

export const archiveReport = vi.fn<typeof originalArchiveReport>();
