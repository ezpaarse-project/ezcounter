import { vi } from 'vitest';

import type * as original from '../header';

export const extractReportHeader = vi.fn<typeof original.extractReportHeader>();

export const extractRegistryId = vi.fn<typeof original.extractRegistryId>();
