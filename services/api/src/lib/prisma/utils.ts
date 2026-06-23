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
  filters: Partial<Record<`${Field}.from` | `${Field}.to`, Date>>
):
  | (DataType[Key] extends null | undefined
      ? Prisma.DateTimeNullableFilter
      : Prisma.DateTimeFilter)
  | undefined {
  if (filters[`${field}.from`] || filters[`${field}.to`]) {
    return {
      gte: filters[`${field}.from`],
      lte: filters[`${field}.to`],
    };
  }
  return undefined;
}
