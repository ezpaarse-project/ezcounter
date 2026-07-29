import { z } from '@ezcounter/dto';

const OpenAlexWorkAuthorInstitution = z.looseObject({
  country_code: z.string().nullish(),
});

const OpenAlexWorkAuthor = z.looseObject({
  author_position: z.enum(['first', 'middle', 'last']),
  institutions: z.array(OpenAlexWorkAuthorInstitution),
});

const OpenAlexWorkTopic = z.looseObject({
  domain: z.looseObject({
    display_name: z.string(),
  }),
});

const OpenAlexWorkIds = z.object({
  doi: z.string(),
  mag: z.string().nullish(),
  openalex: z.string(),
  pmcid: z.string().nullish(),
  pmid: z.string().nullish(),
});

/**
 * Minimal representation of a work from OpenAlex
 */
export const OpenAlexWork = z.looseObject({
  authorships: z.array(OpenAlexWorkAuthor),
  ids: OpenAlexWorkIds,
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
  primary_topic: OpenAlexWorkTopic.nullish(),
  publication_year: z.number().nullish(),
  title: z.string().nullish(),
});

/**
 * Type for the minimal representation of a work from OpenAlex
 */
export type OpenAlexWork = z.infer<typeof OpenAlexWork>;
