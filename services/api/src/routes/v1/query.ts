import { z } from '@ezcounter/dto';

const DEFAULT_ITEM_COUNT = 15;

/**
 * Validation for query parameters needed for paginated data
 */
export const PaginationQuery = z.object({
  count: z.coerce
    .number()
    .int()
    .min(0)
    .default(DEFAULT_ITEM_COUNT)
    .describe('Count of items wanted'),

  order: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),

  page: z.coerce.number().int().min(1).default(1).describe('Page number'),

  sort: z.string().optional().describe('Sort field'),
});

/**
 * Types for query parameters needed for paginated data
 */
export type PaginationQuery = z.infer<typeof PaginationQuery>;
