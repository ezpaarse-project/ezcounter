import { vi } from 'vitest';

export const service = {
  name: 'api',
  version: 'unit-tests',
};

export const getMissingMandatoryServices = vi.fn().mockReturnValue([]);

export const getAllServices = vi.fn().mockReturnValue([
  {
    service: 'dummy',
    hostname: 'foobar',
    createdAt: new Date(),
    updatedAt: new Date(),
    nextAt: new Date(),
  },
]);
