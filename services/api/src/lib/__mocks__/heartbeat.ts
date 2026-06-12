import { vi } from 'vitest';

import type * as original from '../heartbeat';

export const appService = {
  name: 'api',
  version: 'unit-tests',
};

export const getMissingMandatoryServices = vi
  .fn<typeof original.getMissingMandatoryServices>()
  .mockReturnValue([]);

export const getAllServices = vi
  .fn<typeof original.getAllServices>()
  .mockReturnValue([
    {
      createdAt: new Date(),
      hostname: 'foobar',
      nextAt: new Date(),
      service: 'dummy',
      updatedAt: new Date(),
    },
  ]);

export const assertFilesystemsAccess = vi.fn<typeof original.getAllServices>();
