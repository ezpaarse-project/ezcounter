import { vi } from 'vitest';

import type { IEzUnpaywallRemote } from '../types';

class MockedRemote implements IEzUnpaywallRemote {
  public fetchManyDocumentByDOI = vi.fn();
}

export const EzUnpaywallRemote = vi.fn(MockedRemote);
