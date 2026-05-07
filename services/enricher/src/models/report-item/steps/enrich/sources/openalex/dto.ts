import { z } from '@ezcounter/dto';

/**
 * Minimal representation of a work from OpenAlex
 */
export const OpenAlexWork = z.looseObject({
  authorships: z.array(
    z.looseObject({
      author_position: z.enum(['first', 'middle', 'last']),
      institutions: z.array(
        z.looseObject({
          country_code: z.string().nullish(),
        })
      ),
    })
  ),
  ids: z.object({
    doi: z.string(),
    mag: z.string().nullish(),
    openalex: z.string(),
    pmcid: z.string().nullish(),
    pmid: z.string().nullish(),
  }),
  language: z.string().nullish(),
  open_access: z.looseObject({
    is_oa: z.boolean(),
    oa_status: z.enum([
      'diamond',
      'gold',
      'hybrid',
      'bronze',
      'green',
      'closed',
    ]),
  }),
  primary_topic: z
    .looseObject({
      domain: z.looseObject({
        display_name: z.string(),
      }),
    })
    .nullish(),
  publication_year: z.number().nullish(),
  title: z.string().nullish(),
});

/**
 * Type for the minimal representation of a work from OpenAlex
 */
export type OpenAlexWork = z.infer<typeof OpenAlexWork>;
