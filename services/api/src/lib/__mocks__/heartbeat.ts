import { vi } from 'vitest';

export const service = {
  name: 'api',
  version: 'unit-tests',
};

export const getMissingMandatoryServices = vi.fn().mockReturnValue([]);

export const getAllServices = vi.fn().mockReturnValue([
  {
    createdAt: new Date(),
    hostname: 'foobar',
    nextAt: new Date(),
    service: 'dummy',
    updatedAt: new Date(),
  },
]);
