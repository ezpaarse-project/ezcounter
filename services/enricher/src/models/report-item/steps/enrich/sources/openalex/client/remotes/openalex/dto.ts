import { z } from '@ezcounter/dto';

import { OpenAlexWork } from '../../../dto';

/**
 * Validation for the response from OpenAlex
 */
export const OpenAlexResponse = z.looseObject({
  meta: z.looseObject({
    next_cursor: z.string().nullable(),
  }),
  results: z.array(OpenAlexWork),
});

/**
 * Type for the response from OpenAlex
 */
export type OpenAlexResponse = z.infer<typeof OpenAlexResponse>;
