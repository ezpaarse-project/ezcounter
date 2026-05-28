import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { Store } from '~/lib/store';

import type { IEzUnpaywallRemote } from '../types';

export const mockedStore = mockDeep<Store>();

export const mockedRemote = mockDeep<IEzUnpaywallRemote>();

export const createEzUnpaywallStore = vi.fn().mockReturnValue(mockedStore);

export const createEzUnpaywallRemote = vi.fn().mockReturnValue(mockedRemote);
