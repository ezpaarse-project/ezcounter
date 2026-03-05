import { vi } from 'vitest';

import type {
  extractReportHeader as originalExtractReportHeader,
  extractRegistryId as originalExtractRegistryId,
} from '../header';

export const extractReportHeader = vi.fn<typeof originalExtractReportHeader>();
export const extractRegistryId = vi.fn<typeof originalExtractRegistryId>();
