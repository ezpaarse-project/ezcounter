import { vi } from 'vitest';

import type * as original from '../index';

export const getDocumentByDOI = vi.fn<typeof original.getDocumentByDOI>();
