import { mockDeep } from 'vitest-mock-extended';

import type * as original from '..';

export const dbClient = mockDeep<typeof original.dbClient>();
