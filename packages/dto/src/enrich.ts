import { z } from '.';

export const EnrichSource = z.enum(['ezunpaywall', 'openalex']);

export type EnrichSource = z.infer<typeof EnrichSource>;

/**
 * Validation for options when enriching items with ezUnpaywall
 */
export const EnrichEzUnpaywallOptions = z.object({});

/**
 * Type for options when enriching items with ezUnpaywall
 */
export type EnrichEzUnpaywallOptions = z.infer<typeof EnrichEzUnpaywallOptions>;

/**
 * Validation for options when enriching items with OpenAlex
 */
export const EnrichOpenAlexOptions = z.object({});

/**
 * Type for options when enriching items with OpenAlex
 */
export type EnrichOpenAlexOptions = z.infer<typeof EnrichOpenAlexOptions>;
