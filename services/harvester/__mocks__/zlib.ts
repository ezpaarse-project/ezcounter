import { PassThrough } from 'node:stream';

import { vi } from 'vitest';

export const createGunzip = vi.fn().mockReturnValue(new PassThrough());

export const createGzip = vi.fn().mockReturnValue(new PassThrough());
