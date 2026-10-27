import { z } from '@ezcounter/dto';

// oxlint-disable typescript/explicit-function-return-type - Let Zod resolve types

/**
 * Describe a diff value (based on https://github.com/unjs/ohash)
 *
 * @param key The validation for the key that changed
 * @param value The validation to use for value
 *
 * @returns Validation for a diff value
 */
const describeDiffValue = <
  Key extends z.ZodLiteral | z.ZodTemplateLiteral,
  Value extends z.ZodType,
>(
  key: Key,
  value: Value
) => z.object({ key, value });

/**
 * Describe a diff entry (based on https://github.com/unjs/ohash)
 *
 * @param key The validation for the key that changed
 * @param value The validation to use for value
 *
 * @returns Validation for a diff entry
 */
export const describeDiffEntry = <
  Key extends z.ZodLiteral | z.ZodTemplateLiteral,
  Value extends z.ZodType,
>(
  key: Key,
  value: Value
) =>
  z.discriminatedUnion('type', [
    z.object({
      key,
      newValue: describeDiffValue(key, value),
      oldValue: describeDiffValue(key, value),
      type: z.literal('changed'),
    }),
    z.object({
      key,
      newValue: describeDiffValue(key, value),
      type: z.literal('added'),
    }),
    z.object({
      key,
      oldValue: describeDiffValue(key, value),
      type: z.literal('removed'),
    }),
  ]);

/**
 * Prepare `describeDiffEntry` to be used to describe changes on given type param
 *
 * @returns Functions to describe diff entries about type
 */
export const prepareDiffFor = <
  Reference extends Record<string, unknown>,
>() => ({
  describe: <
    Value extends z.ZodType,
    Key extends string = Exclude<keyof Reference, number | symbol>,
  >(
    key: Key,
    value: Value
  ) => describeDiffEntry(z.literal(key), value),

  describeNested: <
    Value extends z.ZodUnion,
    Key extends string = Exclude<keyof Reference, number | symbol>,
  >(
    key: Key,
    values: Value
  ) => describeDiffEntry(z.templateLiteral([key, '.', z.string()]), values),
});

// oxlint-enable typescript/explicit-function-return-type

/**
 * Schema for a diff value (based on https://github.com/unjs/ohash)
 */
export const DiffValue = z.object({
  key: z.string(),
  value: z.json().optional(),
});

/**
 * Type for a diff value (based on https://github.com/unjs/ohash)
 */
export type DiffValue = z.infer<typeof DiffValue>;

/**
 * Schema for a diff entry (based on https://github.com/unjs/ohash)
 */
export const DiffEntry = z.discriminatedUnion('type', [
  z.object({
    key: z.string(),
    newValue: DiffValue,
    type: z.literal('added'),
  }),
  z.object({
    key: z.string(),
    newValue: DiffValue,
    oldValue: DiffValue,
    type: z.literal('changed'),
  }),
  z.object({
    key: z.string(),
    oldValue: DiffValue,
    type: z.literal('removed'),
  }),
]);
// Export const DiffEntry = z.object({
//   Key: z.string(),
//   NewValue: DiffValue.optional(),
//   OldValue: DiffValue.optional(),
//   Type: z.enum(['added', 'changed', 'removed']),
// })

/**
 * Type for a diff entry (based on https://github.com/unjs/ohash)
 */
export type DiffEntry = z.infer<typeof DiffEntry>;
