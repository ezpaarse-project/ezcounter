import type { Prisma } from '@ezcounter/database';

/**
 * Shorthand to build a Date filter using common pattern
 *
 * @param field - The field to query
 * @param filters - The filters
 *
 * @returns The query on field
 */
export function buildDateFilter<
  DataType extends Record<string, unknown>,
  Key extends keyof DataType = keyof DataType,
  Field extends string = Key extends string
    ? DataType[Key] extends Date | null | undefined
      ? Key
      : never
    : never,
>(
  field: Field,
  filters: Partial<Record<`${Field}[gte]` | `${Field}[lte]`, Date>>
):
  | (DataType[Key] extends null | undefined
      ? Prisma.DateTimeNullableFilter
      : Prisma.DateTimeFilter)
  | undefined {
  if (filters[`${field}[gte]`] || filters[`${field}[lte]`]) {
    return {
      gte: filters[`${field}[gte]`],
      lte: filters[`${field}[lte]`],
    };
  }
  return undefined;
}

/**
 * Shorthand to extract sub-include keys from other include keys
 *
 * @param prefix - The prefix
 * @param input - The include keys
 *
 * @returns The keys to pass to sub-include
 */
export function extractSubIncludes<SubInclude extends string>(
  prefix: string,
  input: string[]
): SubInclude[] {
  const dotPrefix = `${prefix}.`;

  const filtered = input.filter((key) => key.startsWith(dotPrefix));
  return filtered.map((key) => key.replace(dotPrefix, '')) as SubInclude[];
}
