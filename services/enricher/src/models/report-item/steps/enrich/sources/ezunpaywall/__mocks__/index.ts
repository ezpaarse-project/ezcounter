import { vi } from 'vitest';

import type * as original from '../index';

export const enrichItemUsingEzUnpaywall =
  vi.fn<typeof original.enrichItemUsingEzUnpaywall>();
