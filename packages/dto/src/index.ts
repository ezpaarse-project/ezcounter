import { z } from 'zod';

export * from 'zod';

export const zStringToNullableBoolean = z
  .stringbool()
  .or(z.literal('null').transform(() => null));
