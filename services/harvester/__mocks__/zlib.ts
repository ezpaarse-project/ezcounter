import { PassThrough } from 'node:stream';

import { vi } from 'vitest';

export const createGunzip = vi
  .fn<() => PassThrough>()
  .mockReturnValue(new PassThrough());

export const createGzip = vi
  .fn<() => PassThrough>()
  .mockReturnValue(new PassThrough());
