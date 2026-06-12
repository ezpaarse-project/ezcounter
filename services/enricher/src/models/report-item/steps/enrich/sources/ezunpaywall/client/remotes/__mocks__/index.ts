import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { Store } from '~/lib/store';

import type * as original from '..';
import type { IEzUnpaywallRemote } from '../types';

export const mockedStore = mockDeep<Store>();

export const mockedRemote = mockDeep<IEzUnpaywallRemote>();

export const createEzUnpaywallStore = vi
  .fn<typeof original.createEzUnpaywallStore>()
  .mockReturnValue(mockedStore);

export const createEzUnpaywallRemote = vi
  .fn<typeof original.createEzUnpaywallRemote>()
  .mockReturnValue(mockedRemote);
