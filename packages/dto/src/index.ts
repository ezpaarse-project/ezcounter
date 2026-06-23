import { z } from 'zod';

export * from 'zod';

export const zStringToBoolean = z
  .literal(['true', 'false'])
  .transform((val) => val === 'true' || false);

export const zStringToNullableBoolean = zStringToBoolean.or(
  z.literal('null').transform(() => null)
);
