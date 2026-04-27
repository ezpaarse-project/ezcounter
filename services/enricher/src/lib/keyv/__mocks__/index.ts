import type { Keyv } from 'keyv';
import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

export const mockedStore = mockDeep<Keyv>();

export const createStore = vi.fn().mockReturnValue(mockedStore);
