import { vi } from 'vitest';

import type { extractReportItems as originalExtractReportItems } from '..';

export const extractReportItems = vi.fn<typeof originalExtractReportItems>();
