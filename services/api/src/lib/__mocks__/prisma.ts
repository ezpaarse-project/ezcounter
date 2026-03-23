import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { PrismaClient } from '@ezcounter/database';

export const dbClient = mockDeep<PrismaClient>();

export const dbPing = vi.fn();
