import { z } from '@ezcounter/dto';

/**
 * Minimal representation of an item from ezUnpaywall
 *
 * @see https://unpaywall.inist.fr/graphql
 */
export const EzUnpaywallDocument = z.looseObject({
  doi: z.string(),
  is_oa: z.boolean().nullish(),
  journal_is_oa: z.boolean().nullish(),
  journal_issn_l: z.string().nullish(),
  journal_issns: z.string().nullish(),
  oa_status: z.string().nullish(),
  year: z.number().nullish(),
});

/**
 * Type for the minimal representation of an item from ezUnpaywall
 */
export type EzUnpaywallDocument = z.infer<typeof EzUnpaywallDocument>;
