// oxlint-disable-next-line import/no-unassigned-import
import 'zod/compile';
import { z } from 'zod';

export * from 'zod';

export const zStringToNullableBoolean = z
  .stringbool()
  .or(z.literal('null').transform(() => null));

// oxlint-disable-next-line typescript/explicit-function-return-type - Don't mess with Zod types.
export const zToArray = <Type extends z.ZodType>(element: Type) =>
  element
    .or(z.array(element))
    .transform((val) => (Array.isArray(val) ? val : [val]));
