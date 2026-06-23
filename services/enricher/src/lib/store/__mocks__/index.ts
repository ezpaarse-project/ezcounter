import type { Cacheable } from 'cacheable';
import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type * as original from '..';

export const mockedStore = mockDeep<Cacheable>();

export const createStore = vi
  .fn<typeof original.createStore>()
  .mockReturnValue(mockedStore);
