import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { Store } from '~/lib/keyv';

import type { IOpenAlexRemote } from '../types';

export const mockedStore = mockDeep<Store>();

export const mockedRemote = mockDeep<IOpenAlexRemote>();

export const createOpenAlexStore = vi.fn().mockReturnValue(mockedStore);

export const createOpenAlexRemote = vi.fn().mockReturnValue(mockedRemote);
