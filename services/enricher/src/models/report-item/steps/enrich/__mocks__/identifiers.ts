import { vi } from 'vitest';

import type * as original from '../identifiers';

export const getDOIOfItem = vi.fn<typeof original.getDOIOfItem>();

export const getOnlineISSNOfItem = vi.fn<typeof original.getOnlineISSNOfItem>();

export const getPrintISSNOfItem = vi.fn<typeof original.getPrintISSNOfItem>();
