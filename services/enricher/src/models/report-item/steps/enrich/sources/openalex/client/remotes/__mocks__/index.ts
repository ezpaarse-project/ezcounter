import { vi } from 'vitest';

import type { IOpenAlexRemote } from '../types';

class MockedRemote implements IOpenAlexRemote {
  public fetchManyWorkByDOI = vi.fn();
}

export const CNRSGatewayRemote = vi.fn(MockedRemote);
export const OpenAlexRemote = vi.fn(MockedRemote);
