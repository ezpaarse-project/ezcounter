import { vi } from 'vitest';

import type * as original from '../elasticsearch';

export const esPing = vi.fn<typeof original.esPing>();

export const esBulkIndex = vi.fn<typeof original.esBulkIndex>();
