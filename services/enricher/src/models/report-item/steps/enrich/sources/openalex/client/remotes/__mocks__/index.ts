import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { Store } from '~/lib/store';

import type * as original from '..';
import type { IOpenAlexRemote } from '../types';

export const mockedStore = mockDeep<Store>();

export const mockedRemote = mockDeep<IOpenAlexRemote>();

export const createOpenAlexStore = vi
  .fn<typeof original.createOpenAlexStore>()
  .mockReturnValue(mockedStore);

export const createOpenAlexRemote = vi
  .fn<typeof original.createOpenAlexRemote>()
  .mockReturnValue(mockedRemote);
